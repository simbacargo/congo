from decimal import Decimal

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from authentication.models import (
    ROLE_COMPANY_MANAGER, ROLE_NGO_ADMIN, ROLE_STATION_AGENT, User,
)
from fuel_app.models import Church, FuelStation, FuelType, ParentCompany, Transaction


class HistoryAPITests(TestCase):
    """Coverage for /api/agents/…/history/ and /api/stations/…/history/."""

    @classmethod
    def setUpTestData(cls):
        cls.company = ParentCompany.objects.create(name="Alpha Oil", code="ALPHA")
        cls.other_company = ParentCompany.objects.create(name="Beta Oil", code="BETA")
        cls.station = FuelStation.objects.create(
            name="Katuba", code="KAT", company=cls.company
        )
        cls.other_station = FuelStation.objects.create(
            name="Kamalondo", code="KAM", company=cls.other_company
        )
        cls.church = Church.objects.create(name="Église A", station=cls.station)
        cls.other_church = Church.objects.create(name="Église B", station=cls.other_station)
        cls.fuel = FuelType.objects.create(name="Essence", code="ESS")

        cls.agent = cls._user("agent1", ROLE_STATION_AGENT, station=cls.station)
        cls.agent2 = cls._user("agent2", ROLE_STATION_AGENT, station=cls.station)
        cls.foreign_agent = cls._user(
            "agent3", ROLE_STATION_AGENT, station=cls.other_station
        )
        cls.manager = cls._user("mgr", ROLE_COMPANY_MANAGER, company=cls.company)
        cls.admin = cls._user("admin", ROLE_NGO_ADMIN)

        # 3 transactions for agent1, 1 for agent2, 1 at the other station.
        for i in range(3):
            cls._tx(cls.agent, cls.station, cls.church, Decimal("100.00"))
        cls._tx(cls.agent2, cls.station, cls.church, Decimal("50.00"))
        cls._tx(cls.foreign_agent, cls.other_station, cls.other_church, Decimal("25.00"))

    @classmethod
    def _user(cls, username, role, station=None, company=None):
        return User.objects.create_user(
            username=username, password="pw", role=role,
            assigned_station=station, managed_company=company,
        )

    @classmethod
    def _tx(cls, agent, station, church, amount):
        return Transaction.objects.create(
            station=station, church=church, agent=agent, fuel_type=cls.fuel,
            currency_used=Transaction.Currency.USD, amount_usd=amount,
            exchange_rate=Decimal("2800.0000"),
        )

    def client_for(self, user):
        c = APIClient()
        c.force_authenticate(user=user)
        return c

    # ── agent history ──────────────────────────────────────────────────────

    def test_agent_sees_only_own_transactions(self):
        res = self.client_for(self.agent).get(reverse("fuel:api-agent-history-me"))
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["count"], 3)
        self.assertEqual(res.data["summary"]["count"], 3)
        # 3 × $100 × 2% levy
        self.assertEqual(Decimal(res.data["summary"]["total_levy_usd"]), Decimal("6.0000"))
        self.assertEqual(res.data["agent"]["username"], "agent1")
        self.assertTrue(all(r["agent_username"] == "agent1" for r in res.data["results"]))

    def test_agent_cannot_read_another_agents_history(self):
        res = self.client_for(self.agent).get(
            reverse("fuel:api-agent-history", args=[self.agent2.id])
        )
        self.assertEqual(res.status_code, 403)

    def test_admin_can_read_any_agent_history(self):
        res = self.client_for(self.admin).get(
            reverse("fuel:api-agent-history", args=[self.agent.id])
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["count"], 3)

    def test_manager_scoped_to_own_company(self):
        ok = self.client_for(self.manager).get(
            reverse("fuel:api-agent-history", args=[self.agent.id])
        )
        self.assertEqual(ok.status_code, 200)
        denied = self.client_for(self.manager).get(
            reverse("fuel:api-agent-history", args=[self.foreign_agent.id])
        )
        self.assertEqual(denied.status_code, 403)

    def test_anonymous_is_rejected(self):
        self.assertEqual(
            APIClient().get(reverse("fuel:api-agent-history-me")).status_code, 401
        )

    def test_date_filter_narrows_summary_and_results(self):
        res = self.client_for(self.agent).get(
            reverse("fuel:api-agent-history-me"), {"from": "2000-01-01", "to": "2000-01-02"}
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["count"], 0)
        self.assertEqual(res.data["summary"]["count"], 0)

    def test_bad_date_filter_is_ignored_not_an_error(self):
        res = self.client_for(self.agent).get(
            reverse("fuel:api-agent-history-me"), {"from": "not-a-date"}
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["count"], 3)

    def test_status_filter(self):
        res = self.client_for(self.agent).get(
            reverse("fuel:api-agent-history-me"), {"status": "verified"}
        )
        self.assertEqual(res.data["count"], 0)
        res = self.client_for(self.agent).get(
            reverse("fuel:api-agent-history-me"), {"status": "pending"}
        )
        self.assertEqual(res.data["count"], 3)

    def test_pagination_summary_covers_whole_set_not_just_page(self):
        res = self.client_for(self.agent).get(
            reverse("fuel:api-agent-history-me"), {"page_size": 2}
        )
        self.assertEqual(len(res.data["results"]), 2)
        self.assertEqual(res.data["count"], 3)
        self.assertEqual(res.data["num_pages"], 2)
        self.assertIsNotNone(res.data["next"])
        # Summary is over all 3, not the 2 on this page.
        self.assertEqual(res.data["summary"]["count"], 3)

    # ── station history ────────────────────────────────────────────────────

    def test_station_history_covers_all_agents_at_the_station(self):
        res = self.client_for(self.agent).get(reverse("fuel:api-station-history-me"))
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["count"], 4)
        self.assertEqual(res.data["station"]["code"], "KAT")
        by_agent = {r["username"]: r["count"] for r in res.data["by_agent"]}
        self.assertEqual(by_agent, {"agent1": 3, "agent2": 1})

    def test_agent_cannot_read_another_station(self):
        res = self.client_for(self.agent).get(
            reverse("fuel:api-station-history", args=[self.other_station.id])
        )
        self.assertEqual(res.status_code, 403)

    def test_station_history_without_assignment_is_a_400(self):
        stray = self._user("stray", ROLE_STATION_AGENT)
        res = self.client_for(stray).get(reverse("fuel:api-station-history-me"))
        self.assertEqual(res.status_code, 400)

    def test_admin_sees_every_station(self):
        res = self.client_for(self.admin).get(
            reverse("fuel:api-station-history", args=[self.other_station.id])
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["count"], 1)

    def test_by_agent_respects_filters(self):
        res = self.client_for(self.agent).get(
            reverse("fuel:api-station-history-me"), {"from": "2000-01-01", "to": "2000-01-02"}
        )
        self.assertEqual(res.data["by_agent"], [])
