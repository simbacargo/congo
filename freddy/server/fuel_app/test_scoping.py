"""Row-level scoping and role tiers on the SPA API (`/api/admin/…`).

The fixture gives two companies with one station each. Alpha/Katuba holds four
transactions, Beta/Kamalondo one — so "did scoping apply" is always a distinct
number per role rather than a boolean.
"""
from decimal import Decimal

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from authentication.models import ROLE_STATION_AGENT, User
from fuel_app.models import Disbursement, FuelStation, Transaction
from fuel_app.tests import HistoryFixture


class ScopingFixture(HistoryFixture):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        # A superuser carrying the *default* role. This is the account shape
        # `createsuperuser` produces, and the one the old IsNGOAdmin locked out.
        cls.superuser = User.objects.create_user(
            username="root", password="pw", role=ROLE_STATION_AGENT,
        )
        cls.superuser.is_superuser = True
        cls.superuser.save(update_fields=["is_superuser"])

        # A correctly-roled but unassigned manager: must see nothing, not all.
        cls.orphan_manager = User.objects.create_user(
            username="orphan", password="pw", role="COMPANY_MANAGER",
        )
        cls.disbursement = Disbursement.objects.create(
            church=cls.church, period_start="2026-01-01", period_end="2026-01-31",
            amount_usd=Decimal("100.00"),
        )

    def client_for(self, user):
        c = APIClient()
        c.force_authenticate(user=user)
        return c


class SuperuserAccessTests(ScopingFixture, TestCase):
    """A superuser must not be locked out by carrying the default agent role."""

    def test_superuser_with_agent_role_reaches_admin_api(self):
        for name in ("admin_api:dashboard-stats", "admin_api:tx-list",
                     "admin_api:reports", "admin_api:audit"):
            res = self.client_for(self.superuser).get(reverse(name))
            self.assertEqual(res.status_code, 200, f"{name} refused the superuser")

    def test_superuser_sees_everything_despite_no_station(self):
        res = self.client_for(self.superuser).get(reverse("admin_api:tx-list"))
        self.assertEqual(res.data["count"], 5)

    def test_superuser_may_write(self):
        res = self.client_for(self.superuser).post(
            reverse("admin_api:admin-company-list"), {"name": "Gamma", "code": "GAM"}
        )
        self.assertEqual(res.status_code, 201)


class TransactionScopingTests(ScopingFixture, TestCase):

    def test_list_counts_per_role(self):
        cases = [(self.admin, 5), (self.manager, 4), (self.agent, 4), (self.foreign_agent, 1)]
        for user, expected in cases:
            res = self.client_for(user).get(reverse("admin_api:tx-list"))
            self.assertEqual(res.status_code, 200)
            self.assertEqual(res.data["count"], expected, f"{user.username} saw the wrong count")

    def test_totals_match_the_scoped_rows(self):
        res = self.client_for(self.agent).get(reverse("admin_api:tx-list"))
        # Katuba: 3 × $100 + 1 × $50 = $350 × 2% = $7.00
        self.assertEqual(Decimal(str(res.data["totals"]["levy"])), Decimal("7.0000"))

    def test_unassigned_user_sees_nothing_not_everything(self):
        res = self.client_for(self.orphan_manager).get(reverse("admin_api:tx-list"))
        self.assertEqual(res.data["count"], 0)

    def test_filter_cannot_widen_scope(self):
        """An agent passing another company's ?company= still gets only its own."""
        res = self.client_for(self.agent).get(
            reverse("admin_api:tx-list"), {"company": str(self.other_company.id)}
        )
        self.assertEqual(res.data["count"], 0)

    def test_out_of_scope_detail_is_404(self):
        foreign_tx = Transaction.objects.filter(station=self.other_station).first()
        res = self.client_for(self.agent).get(
            reverse("admin_api:tx-detail", args=[foreign_tx.id])
        )
        self.assertEqual(res.status_code, 404)

    def test_in_scope_detail_is_readable(self):
        tx = Transaction.objects.filter(station=self.station).first()
        res = self.client_for(self.agent).get(reverse("admin_api:tx-detail", args=[tx.id]))
        self.assertEqual(res.status_code, 200)

    def test_only_admin_may_patch_status(self):
        tx = Transaction.objects.filter(station=self.station).first()
        url = reverse("admin_api:tx-detail", args=[tx.id])
        self.assertEqual(
            self.client_for(self.agent).patch(url, {"status": "VERIFIED"}).status_code, 403
        )
        self.assertEqual(
            self.client_for(self.manager).patch(url, {"status": "VERIFIED"}).status_code, 403
        )
        res = self.client_for(self.admin).patch(url, {"status": "VERIFIED"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["status"], "VERIFIED")

    def test_bulk_action_cannot_touch_out_of_scope_rows(self):
        foreign_tx = Transaction.objects.filter(station=self.other_station).first()
        res = self.client_for(self.admin).post(
            reverse("admin_api:tx-bulk"),
            {"ids": [str(foreign_tx.id)], "action": "verify"}, format="json",
        )
        self.assertEqual(res.data["updated"], 1)  # admin is unrestricted
        self.assertEqual(
            self.client_for(self.agent).post(
                reverse("admin_api:tx-bulk"),
                {"ids": [str(foreign_tx.id)], "action": "verify"}, format="json",
            ).status_code, 403,
        )


class DirectoryScopingTests(ScopingFixture, TestCase):

    def _count(self, user, route):
        res = self.client_for(user).get(reverse(route))
        self.assertEqual(res.status_code, 200)
        return res.data["count"]

    def test_companies_scoped(self):
        route = "admin_api:admin-company-list"
        self.assertEqual(self._count(self.admin, route), 2)
        self.assertEqual(self._count(self.manager, route), 1)
        self.assertEqual(self._count(self.agent, route), 1)
        self.assertEqual(self._count(self.orphan_manager, route), 0)

    def test_stations_scoped(self):
        route = "admin_api:admin-station-list"
        self.assertEqual(self._count(self.admin, route), 2)
        self.assertEqual(self._count(self.manager, route), 1)
        self.assertEqual(self._count(self.agent, route), 1)

    def test_churches_scoped(self):
        route = "admin_api:admin-church-list"
        self.assertEqual(self._count(self.admin, route), 2)
        self.assertEqual(self._count(self.manager, route), 1)
        self.assertEqual(self._count(self.agent, route), 1)

    def test_agent_sees_only_itself_in_user_list(self):
        res = self.client_for(self.agent).get(reverse("admin_api:admin-agent-list"))
        self.assertEqual(res.data["count"], 1)
        self.assertEqual(res.data["results"][0]["username"], "agent1")

    def test_manager_sees_own_company_agents(self):
        res = self.client_for(self.manager).get(reverse("admin_api:admin-agent-list"))
        usernames = {r["username"] for r in res.data["results"]}
        self.assertIn("agent1", usernames)
        self.assertIn("agent2", usernames)
        self.assertNotIn("agent3", usernames)  # other company

    def test_out_of_scope_station_detail_is_404(self):
        res = self.client_for(self.agent).get(
            reverse("admin_api:admin-station-detail", args=[self.other_station.id])
        )
        self.assertEqual(res.status_code, 404)

    def test_disbursements_hidden_from_agents(self):
        self.assertEqual(
            self.client_for(self.agent).get(
                reverse("admin_api:admin-disbursement-list")
            ).data["count"], 0,
        )
        self.assertEqual(
            self.client_for(self.manager).get(
                reverse("admin_api:admin-disbursement-list")
            ).data["count"], 1,
        )

    def test_audit_hidden_from_non_admins(self):
        self.assertEqual(
            self.client_for(self.agent).get(reverse("admin_api:audit")).status_code, 403
        )
        self.assertEqual(
            self.client_for(self.admin).get(reverse("admin_api:audit")).status_code, 200
        )


class WritePermissionTests(ScopingFixture, TestCase):

    def test_company_writes_are_admin_only(self):
        url = reverse("admin_api:admin-company-list")
        body = {"name": "Gamma Oil", "code": "GAM"}
        self.assertEqual(self.client_for(self.agent).post(url, body).status_code, 403)
        self.assertEqual(self.client_for(self.manager).post(url, body).status_code, 403)
        self.assertEqual(self.client_for(self.admin).post(url, body).status_code, 201)

    def test_station_writes_allow_managers(self):
        url = reverse("admin_api:admin-station-list")
        self.assertEqual(
            self.client_for(self.agent).post(
                url, {"name": "New", "code": "N1", "company": str(self.company.id)}
            ).status_code, 403,
        )
        self.assertEqual(
            self.client_for(self.manager).post(
                url, {"name": "New", "code": "N1", "company": str(self.company.id)}
            ).status_code, 201,
        )

    def test_fuel_types_readable_by_all_writable_by_admin(self):
        url = reverse("admin_api:admin-fuel-type-list")
        self.assertEqual(self.client_for(self.agent).get(url).status_code, 200)
        self.assertEqual(
            self.client_for(self.agent).post(url, {"name": "Diesel", "code": "DSL"}).status_code, 403
        )
        self.assertEqual(
            self.client_for(self.admin).post(url, {"name": "Diesel", "code": "DSL"}).status_code, 201
        )

    def test_reports_are_admin_and_manager_only(self):
        url = reverse("admin_api:reports")
        self.assertEqual(self.client_for(self.agent).get(url).status_code, 403)
        self.assertEqual(self.client_for(self.manager).get(url).status_code, 200)
        self.assertEqual(self.client_for(self.admin).get(url).status_code, 200)

    def test_agent_creation_without_password_does_not_crash(self):
        """Regression: make_random_password was removed in Django 5.1."""
        res = self.client_for(self.admin).post(
            reverse("admin_api:admin-agent-list"),
            {"username": "brand_new", "role": ROLE_STATION_AGENT},
        )
        self.assertEqual(res.status_code, 201, res.data)
        self.assertFalse(User.objects.get(username="brand_new").check_password(""))


class DashboardScopingTests(ScopingFixture, TestCase):

    def test_kpis_are_scoped(self):
        admin_stats = self.client_for(self.admin).get(reverse("admin_api:dashboard-stats")).data
        agent_stats = self.client_for(self.agent).get(reverse("admin_api:dashboard-stats")).data
        self.assertEqual(admin_stats["total_count"], 5)
        self.assertEqual(agent_stats["total_count"], 4)
        self.assertNotEqual(admin_stats["total_levy"], agent_stats["total_levy"])

    def test_top_stations_present_and_scoped(self):
        admin_stats = self.client_for(self.admin).get(reverse("admin_api:dashboard-stats")).data
        agent_stats = self.client_for(self.agent).get(reverse("admin_api:dashboard-stats")).data
        self.assertEqual(len(admin_stats["top_stations"]), 2)
        self.assertEqual(len(agent_stats["top_stations"]), 1)
        self.assertEqual(agent_stats["top_stations"][0]["name"], "Katuba")
        self.assertIn("target_pct", agent_stats["top_stations"][0])

    def test_disbursement_totals_are_scoped(self):
        agent_stats = self.client_for(self.agent).get(reverse("admin_api:dashboard-stats")).data
        self.assertEqual(agent_stats["pending_disburse"], 0)

    def test_chart_honours_days_and_returns_that_many_points(self):
        res = self.client_for(self.admin).get(reverse("admin_api:dashboard-chart"), {"days": 7})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data["data"]), 7)

    def test_chart_days_is_clamped(self):
        res = self.client_for(self.admin).get(reverse("admin_api:dashboard-chart"), {"days": 9999})
        self.assertEqual(len(res.data["data"]), 365)


class HistoryAndTargetTests(ScopingFixture, TestCase):

    def test_station_history_alias_works(self):
        res = self.client_for(self.agent).get(
            reverse("admin_api:station-history", args=[self.station.id])
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["count"], 4)
        self.assertEqual(res.data["station"]["name"], "Katuba")
        self.assertEqual(len(res.data["by_agent"]), 2)  # agent1 and agent2

    def test_station_with_no_transactions_does_not_leak(self):
        """Regression: emptiness used to be mistaken for permission."""
        empty = FuelStation.objects.create(
            name="Secret Depot", code="SEC", company=self.other_company
        )
        res = self.client_for(self.agent).get(
            reverse("admin_api:station-history", args=[empty.id])
        )
        self.assertEqual(res.status_code, 403)
        self.assertNotIn("Secret Depot", str(res.data))

    def test_agent_history_alias_works(self):
        res = self.client_for(self.agent).get(reverse("admin_api:agent-history-me"))
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["count"], 3)

    def test_driver_detail_includes_scoped_levy_history(self):
        from fuel_app.models import Driver

        # The driver's phone is free-text from a Google Form; transactions
        # store it already normalized (TransactionCreateSerializer.create).
        driver = Driver.objects.create(full_name="Jean Mukendi", phone="+243 812 345 678")
        self._tx(self.agent, self.station, self.church, Decimal("10.00"),
                 driver_phone="812345678")
        self._tx(self.foreign_agent, self.other_station, self.other_church,
                 Decimal("10.00"), driver_phone="812345678")

        url = reverse("admin_api:driver-detail", args=[driver.id])
        admin_res = self.client_for(self.admin).get(url)
        self.assertEqual(admin_res.status_code, 200)
        self.assertEqual(admin_res.data["summary"]["count"], 2)
        self.assertEqual(admin_res.data["driver"]["full_name"], "Jean Mukendi")

        # The agent sees only the levy collected at their own station.
        agent_res = self.client_for(self.agent).get(url)
        self.assertEqual(agent_res.data["summary"]["count"], 1)

    def test_station_target_crud_and_scoping(self):
        url = reverse("admin_api:admin-station-target-list")
        body = {"station": str(self.station.id), "year": 2026, "month": 8, "target_usd": "500.00"}

        self.assertEqual(self.client_for(self.agent).post(url, body).status_code, 403)
        res = self.client_for(self.manager).post(url, body)
        self.assertEqual(res.status_code, 201, res.data)

        # The agent can read their own station's target...
        self.assertEqual(self.client_for(self.agent).get(url).data["count"], 1)
        # ...but a foreign agent sees none of it.
        self.assertEqual(self.client_for(self.foreign_agent).get(url).data["count"], 0)

    def test_station_target_rejects_duplicate_and_bad_month(self):
        url = reverse("admin_api:admin-station-target-list")
        base = {"station": str(self.station.id), "year": 2026, "month": 8, "target_usd": "500.00"}
        self.assertEqual(self.client_for(self.admin).post(url, base).status_code, 201)
        self.assertEqual(self.client_for(self.admin).post(url, base).status_code, 400)
        self.assertEqual(
            self.client_for(self.admin).post(url, {**base, "month": 13}).status_code, 400
        )

    def test_target_drives_dashboard_progress(self):
        self.client_for(self.admin).post(
            reverse("admin_api:admin-station-target-list"),
            {"station": str(self.station.id), "year": timezone.now().year,
             "month": timezone.now().month, "target_usd": "10.00"},
        )
        stats = self.client_for(self.agent).get(reverse("admin_api:dashboard-stats")).data
        katuba = stats["top_stations"][0]
        self.assertEqual(katuba["target_usd"], 10.0)
        # $7.00 of levy against a $10 target = 70%
        self.assertEqual(katuba["target_pct"], 70)


class AuditFilterTests(ScopingFixture, TestCase):

    def setUp(self):
        tx = Transaction.objects.filter(station=self.station).first()
        self.client_for(self.admin).patch(
            reverse("admin_api:tx-detail", args=[tx.id]), {"status": "VERIFIED"}
        )
        self.receipt = tx.receipt_code

    def test_audit_filters_by_receipt_and_field(self):
        url = reverse("admin_api:audit")
        client = self.client_for(self.admin)
        self.assertEqual(client.get(url).data["count"], 1)
        self.assertEqual(client.get(url, {"q": self.receipt}).data["count"], 1)
        self.assertEqual(client.get(url, {"q": "LCI-NOPE"}).data["count"], 0)
        self.assertEqual(client.get(url, {"field": "status"}).data["count"], 1)
        self.assertEqual(client.get(url, {"field": "notes"}).data["count"], 0)
        self.assertEqual(client.get(url, {"user": "admin"}).data["count"], 1)

    def test_audit_filters_by_date_and_ignores_garbage(self):
        url = reverse("admin_api:audit")
        client = self.client_for(self.admin)
        today = timezone.now().date().isoformat()
        self.assertEqual(client.get(url, {"from": today}).data["count"], 1)
        self.assertEqual(client.get(url, {"to": "2000-01-01"}).data["count"], 0)
        # An unparseable date is ignored rather than erroring.
        self.assertEqual(client.get(url, {"from": "not-a-date"}).data["count"], 1)


class IdentityTests(ScopingFixture, TestCase):

    def test_me_returns_identity_permissions_and_badge(self):
        res = self.client_for(self.manager).get(reverse("admin_api:me"))
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["user"]["username"], "mgr")
        self.assertEqual(res.data["user"]["managed_company_name"], "Alpha Oil")
        perms = res.data["permissions"]
        self.assertTrue(perms["manage_stations"])
        self.assertFalse(perms["manage_companies"])
        self.assertEqual(res.data["pending_count"], 4)  # scoped to Alpha

    def test_permission_map_for_agent(self):
        perms = self.client_for(self.agent).get(reverse("admin_api:me")).data["permissions"]
        self.assertTrue(perms["view_dashboard"])
        self.assertFalse(perms["manage_stations"])
        self.assertFalse(perms["view_audit"])

    def test_superuser_gets_admin_permissions(self):
        perms = self.client_for(self.superuser).get(reverse("admin_api:me")).data["permissions"]
        self.assertTrue(perms["manage_companies"])
        self.assertTrue(perms["view_audit"])

    def test_login_returns_user_payload_for_every_role(self):
        for user in (self.admin, self.manager, self.agent):
            res = APIClient().post(
                reverse("admin_api:login"),
                {"username": user.username, "password": "pw"},
            )
            self.assertEqual(res.status_code, 200, f"{user.username} could not log in")
            self.assertIn("token", res.data)
            self.assertEqual(res.data["user"]["username"], user.username)
            self.assertEqual(res.data["user"]["role"], user.role)

    def test_login_rejects_bad_credentials(self):
        res = APIClient().post(
            reverse("admin_api:login"), {"username": "admin", "password": "wrong"}
        )
        self.assertEqual(res.status_code, 401)

    def test_anonymous_is_refused(self):
        self.assertEqual(APIClient().get(reverse("admin_api:me")).status_code, 401)
        self.assertEqual(APIClient().get(reverse("admin_api:tx-list")).status_code, 401)
