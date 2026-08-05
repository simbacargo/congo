"""JSON API backing the React SPA (`/api/admin/...`).

Two layers of access control, kept deliberately separate:

* **Who may call an endpoint** — the permission classes in
  `fuel_app.permissions`. Reads are broadly open to any authenticated user;
  writes are tiered to match the `@role_required` decorators on the web views.
* **Which rows come back** — the helpers in `fuel_app.scoping`, applied in
  every `get_queryset`. A company manager sees their own company, a station
  agent their own station, and an out-of-scope UUID 404s rather than 403s.

Nothing here is called by the mobile app; `fuel_app.views` still owns that.
"""
import calendar
from datetime import date

from django.conf import settings
from django.db.models import Count, Sum
from django.shortcuts import get_object_or_404
from django.urls import reverse
from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from authentication.models import User
from fuel_app.admin_serializers import (
    ChurchAdminSerializer, DisbursementSerializer, DriverDetailSerializer,
    DriverListSerializer, FuelStationAdminSerializer, ParentCompanyAdminSerializer,
    StationTargetSerializer, UserAdminSerializer,
)
from fuel_app.models import (
    Church, Disbursement, Driver, FuelStation, FuelType, ParentCompany,
    StationTarget, Transaction, TransactionAuditLog,
)
from fuel_app.permissions import (
    IsNGOAdmin, IsNGOAdminOrManager, ReadOnlyOrNGOAdmin, ReadOnlyOrNGOAdminOrManager,
)
from fuel_app.scoping import (
    permission_map, scope_audit_logs, scope_churches, scope_companies,
    scope_disbursements, scope_stations, scope_transactions, scope_users,
)
from fuel_app.serializers import FuelTypeSerializer, TransactionSerializer
from fuel_app.services import (
    CONSUMPTION_ORDER, DRIVER_SORTABLE, barcode_data_uri, build_drivers_excel,
    build_transactions_excel, build_transactions_pdf, driver_card_number,
    driver_queryset, driver_transactions, image_data_uri, kpi_stats, levy_by_day,
    money_str, qr_data_uri, record_audit_log, top_stations_with_targets, tx_queryset,
)


class AdminPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 100


# ─── Auth ─────────────────────────────────────────────────────────────────────

def user_payload(user):
    """The identity block returned by login and `/me/`.

    Station and company are resolved to names as well as ids so the SPA can
    render "Station X — Company Y" in the header without a second round trip.
    """
    station = user.assigned_station
    company = user.managed_company
    return {
        "id": str(user.pk),
        "username": user.username,
        "email": user.email,
        "firstname": user.firstname,
        "lastname": user.lastname,
        "role": user.role,
        "is_superuser": user.is_superuser,
        "assigned_station": str(station.pk) if station else None,
        "assigned_station_name": station.name if station else None,
        "managed_company": str(company.pk) if company else None,
        "managed_company_name": company.name if company else None,
    }


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):  # noqa: A001 — the endpoint really is called /me/
    """Bootstrap payload for the SPA shell.

    Returns identity, capabilities and the sidebar's pending badge in one
    request, so nav gating is decided server-side rather than re-derived from
    role strings in the client.
    """
    pending = scope_transactions(
        request.user, Transaction.objects.filter(status=Transaction.Status.PENDING)
    ).count()
    return Response({
        "user": user_payload(request.user),
        "permissions": permission_map(request.user),
        "pending_count": pending,
    })


# ─── Dashboard ────────────────────────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    stats = kpi_stats(request.user)
    stats["recent"] = TransactionSerializer(stats["recent"], many=True).data
    stats["top_stations"] = top_stations_with_targets(request.user)
    return Response(stats)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_chart(request):
    """Levy per day over the last ?days= (default 30, clamped 2–365)."""
    try:
        days = int(request.query_params.get("days", 30))
    except (TypeError, ValueError):
        days = 30
    return Response({"data": levy_by_day(request.user, days)})


# ─── Transactions ─────────────────────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def transaction_list(request):
    qs = tx_queryset(request)  # already scoped to request.user
    totals = qs.aggregate(levy=Sum("levy_amount_usd"), count=Count("id"))
    paginator = AdminPagination()
    page = paginator.paginate_queryset(qs, request)
    resp = paginator.get_paginated_response(TransactionSerializer(page, many=True).data)
    resp.data["totals"] = {"levy": totals["levy"] or 0, "count": totals["count"] or 0}
    return resp


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def transaction_detail(request, pk):
    # Scoped lookup: an out-of-scope id is indistinguishable from a missing one.
    tx = get_object_or_404(
        scope_transactions(request.user, Transaction.objects.select_related(
            "station__company", "church", "agent", "fuel_type"
        )), pk=pk
    )
    if request.method == "PATCH":
        if not IsNGOAdmin().has_permission(request, None):
            return Response(
                {"detail": "Only NGO admins may change a transaction."},
                status=status.HTTP_403_FORBIDDEN,
            )
        for field in ["status", "notes"]:
            if field in request.data and request.data[field] != getattr(tx, field):
                record_audit_log(tx, request.user, field, getattr(tx, field), request.data[field], request)
                setattr(tx, field, request.data[field])
        tx.save()

    data = TransactionSerializer(tx).data
    data["audit_logs"] = [
        {
            "id": log.id,
            "field_name": log.field_name,
            "old_value": log.old_value,
            "new_value": log.new_value,
            "changed_by_username": log.changed_by.username if log.changed_by else None,
            "changed_at": log.changed_at,
            "ip_address": log.ip_address,
        }
        for log in tx.audit_logs.select_related("changed_by").all()
    ]
    return Response(data)


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsNGOAdmin])
def transaction_bulk_action(request):
    ids = request.data.get("ids", [])
    action_name = request.data.get("action")
    status_map = {"verify": Transaction.Status.VERIFIED, "remit": Transaction.Status.REMITTED}
    if action_name not in status_map or not ids:
        return Response({"detail": "Invalid action or empty ids."}, status=status.HTTP_400_BAD_REQUEST)
    qs = scope_transactions(request.user, Transaction.objects.filter(pk__in=ids))
    count = 0
    for tx in qs:
        old = tx.status
        tx.status = status_map[action_name]
        tx.save()
        record_audit_log(tx, request.user, "status", old, tx.status, request)
        count += 1
    return Response({"updated": count})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def transaction_export_excel(request):
    return build_transactions_excel(tx_queryset(request))


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def transaction_export_pdf(request):
    return build_transactions_pdf(tx_queryset(request))


@api_view(["GET"])
@permission_classes([AllowAny])
def public_verify(request, receipt_code):
    tx = Transaction.objects.filter(
        receipt_code=receipt_code.strip().upper()
    ).select_related("station__company", "church").first()
    if not tx:
        return Response({"valid": False}, status=status.HTTP_404_NOT_FOUND)
    return Response({
        "receipt_code": tx.receipt_code, "station": tx.station.name,
        "company": tx.station.company.name, "church": tx.church.name,
        "amount_usd": str(tx.amount_usd), "levy_usd": str(tx.levy_amount_usd),
        "status": tx.status, "created_at": tx.created_at, "valid": True,
    })


# ─── Companies ────────────────────────────────────────────────────────────────

class CompanyViewSet(mixins.ListModelMixin, mixins.CreateModelMixin,
                      mixins.RetrieveModelMixin, mixins.UpdateModelMixin,
                      viewsets.GenericViewSet):
    serializer_class = ParentCompanyAdminSerializer
    permission_classes = [ReadOnlyOrNGOAdmin]
    pagination_class = AdminPagination

    def get_queryset(self):
        return scope_companies(self.request.user, ParentCompany.objects.annotate(
            station_count=Count("stations", distinct=True),
            tx_count=Count("stations__transactions", distinct=True),
            total_levy=Sum("stations__transactions__levy_amount_usd"),
        ).order_by("name"))

    def retrieve(self, request, *args, **kwargs):
        company = self.get_object()
        stations = scope_stations(
            request.user, company.stations.filter(is_active=True)
        ).annotate(
            tx_count=Count("transactions"), total_levy=Sum("transactions__levy_amount_usd")
        )
        totals = scope_transactions(
            request.user, Transaction.objects.filter(station__company=company)
        ).aggregate(total_usd=Sum("levy_amount_usd"), tx_count=Count("id"))
        data = ParentCompanyAdminSerializer(company).data
        data["stations"] = FuelStationAdminSerializer(stations, many=True).data
        data["totals"] = totals
        return Response(data)


# ─── Stations ─────────────────────────────────────────────────────────────────

class StationViewSet(mixins.ListModelMixin, mixins.CreateModelMixin,
                      mixins.RetrieveModelMixin, mixins.UpdateModelMixin,
                      viewsets.GenericViewSet):
    serializer_class = FuelStationAdminSerializer
    permission_classes = [ReadOnlyOrNGOAdminOrManager]
    pagination_class = AdminPagination

    def get_queryset(self):
        qs = scope_stations(self.request.user, FuelStation.objects.select_related("company").annotate(
            church_count=Count("churches", distinct=True),
            tx_count=Count("transactions", distinct=True),
            total_levy=Sum("transactions__levy_amount_usd"),
        ).order_by("company__name", "name"))
        company_id = self.request.query_params.get("company")
        if company_id:
            qs = qs.filter(company_id=company_id)
        return qs

    def retrieve(self, request, *args, **kwargs):
        station = self.get_object()
        churches = station.churches.filter(is_active=True)
        station_txs = scope_transactions(request.user, station.transactions.all())
        recent_txs = station_txs.select_related("church", "agent", "fuel_type").order_by("-created_at")[:20]
        totals = station_txs.aggregate(total_usd=Sum("levy_amount_usd"), tx_count=Count("id"))
        data = FuelStationAdminSerializer(station).data
        data["churches"] = ChurchAdminSerializer(churches, many=True).data
        data["recent_transactions"] = TransactionSerializer(recent_txs, many=True).data
        data["totals"] = totals
        return Response(data)


# ─── Churches ─────────────────────────────────────────────────────────────────

class ChurchViewSet(mixins.ListModelMixin, mixins.CreateModelMixin,
                     mixins.RetrieveModelMixin, mixins.UpdateModelMixin,
                     viewsets.GenericViewSet):
    serializer_class = ChurchAdminSerializer
    permission_classes = [ReadOnlyOrNGOAdminOrManager]
    pagination_class = AdminPagination

    def get_queryset(self):
        return scope_churches(self.request.user, Church.objects.select_related("station__company").annotate(
            tx_count=Count("transactions"), total_levy=Sum("transactions__levy_amount_usd"),
            disburse_count=Count("disbursements"),
        ).order_by("station__company__name", "station__name", "name"))

    def retrieve(self, request, *args, **kwargs):
        church = self.get_object()
        church_txs = scope_transactions(request.user, church.transactions.all())
        txs = church_txs.select_related("agent", "fuel_type").order_by("-created_at")[:30]
        disbursements = scope_disbursements(
            request.user, church.disbursements.all()
        ).order_by("-created_at")[:10]
        totals = church_txs.aggregate(levy=Sum("levy_amount_usd"), count=Count("id"))
        data = ChurchAdminSerializer(church).data
        data["transactions"] = TransactionSerializer(txs, many=True).data
        data["disbursements"] = DisbursementSerializer(disbursements, many=True).data
        data["totals"] = totals
        return Response(data)


# ─── Disbursements ────────────────────────────────────────────────────────────

class DisbursementViewSet(mixins.ListModelMixin, mixins.CreateModelMixin,
                           mixins.RetrieveModelMixin, mixins.UpdateModelMixin,
                           viewsets.GenericViewSet):
    serializer_class = DisbursementSerializer
    permission_classes = [ReadOnlyOrNGOAdmin]
    pagination_class = AdminPagination

    def get_queryset(self):
        qs = scope_disbursements(self.request.user, Disbursement.objects.select_related(
            "church__station__company", "prepared_by"
        ).order_by("-created_at"))
        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    def list(self, request, *args, **kwargs):
        qs = self.filter_queryset(self.get_queryset())
        totals = qs.aggregate(total=Sum("amount_usd"), count=Count("id"))
        page = self.paginate_queryset(qs)
        resp = self.get_paginated_response(self.get_serializer(page, many=True).data)
        resp.data["totals"] = totals
        return resp

    def perform_create(self, serializer):
        serializer.save(prepared_by=self.request.user)

    @action(detail=True, methods=["post"])
    def pay(self, request, pk=None):
        d = self.get_object()
        d.status = Disbursement.Status.PAID
        d.paid_at = timezone.now()
        d.save()
        return Response(DisbursementSerializer(d).data)


# ─── Drivers ──────────────────────────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def driver_list_api(request):
    base_qs, cur = driver_queryset(request)

    sort = request.GET.get("sort", "name")
    direction = request.GET.get("dir", "asc")
    order_field = DRIVER_SORTABLE.get(sort, "full_name")
    qs = base_qs.order_by(order_field if direction == "asc" else f"-{order_field}")

    paginator = AdminPagination()
    paginator.page_size = 50
    page = paginator.paginate_queryset(qs, request)

    def _opts(field):
        return sorted(v for v in Driver.objects.values_list(field, flat=True).distinct() if v)

    agg = base_qs.order_by()

    def _breakdown(field, limit=None):
        rows = (agg.exclude(**{f"{field}__isnull": True}).exclude(**{field: ""})
                .values(field).annotate(n=Count("id")).order_by("-n"))
        rows = list(rows[:limit] if limit else rows)
        return [[r[field], r["n"]] for r in rows]

    health = {
        "yes": agg.filter(has_health_coverage=True).count(),
        "no": agg.filter(has_health_coverage=False).count(),
        "unknown": agg.filter(has_health_coverage__isnull=True).count(),
    }
    vehicle_bd = _breakdown("vehicle_type")
    top_vehicle = vehicle_bd[0] if vehicle_bd else ["—", 0]
    covered = health["yes"] + health["no"]
    kpi = {
        "filtered": paginator.page.paginator.count,
        "total": Driver.objects.count(),
        "top_vehicle": top_vehicle[0], "top_vehicle_n": top_vehicle[1],
        "coverage_pct": round(100 * health["yes"] / covered) if covered else 0,
        "agents": (agg.exclude(field_agent__isnull=True).exclude(field_agent="")
                   .values("field_agent").distinct().count()),
    }

    cons_map = dict(_breakdown("daily_fuel_consumption"))
    consumption = [[k, cons_map[k]] for k in CONSUMPTION_ORDER if k in cons_map]
    consumption += [[k, v] for k, v in cons_map.items() if k not in CONSUMPTION_ORDER]

    resp = paginator.get_paginated_response(DriverListSerializer(page, many=True).data)
    resp.data.update({
        "filters": cur,
        "sort": sort,
        "dir": direction,
        "filter_options": {
            "communes": _opts("commune"),
            "vehicle_types": _opts("vehicle_type"),
            "fuel_types": _opts("fuel_type"),
            "agents": _opts("field_agent"),
        },
        "kpi": kpi,
        "charts": {
            "commune": _breakdown("commune", 8),
            "vehicle": vehicle_bd,
            "consumption": consumption,
            "health": [health["yes"], health["no"], health["unknown"]],
        },
    })
    return resp


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def driver_detail_api(request, pk):
    driver = get_object_or_404(Driver, pk=pk)
    profile_url = request.build_absolute_uri(reverse("fuel:driver-detail", args=[driver.pk]))
    txs = driver_transactions(driver, request.user)
    agg = txs.aggregate(
        count=Count("id"),
        total_levy_usd=Sum("levy_amount_usd"),
        total_amount_usd=Sum("amount_usd"),
    )
    return Response({
        "driver": DriverDetailSerializer(driver).data,
        "qr_code": qr_data_uri(profile_url),
        "profile_url": profile_url,
        "transactions": TransactionSerializer(txs[:100], many=True).data,
        "summary": {
            "count": agg["count"] or 0,
            "total_levy_usd": money_str(agg["total_levy_usd"], "0.0001"),
            "total_amount_usd": money_str(agg["total_amount_usd"]),
        },
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def driver_id_card_api(request, pk):
    driver = get_object_or_404(Driver, pk=pk)
    raw, card_number = driver_card_number(driver)
    profile_url = request.build_absolute_uri(reverse("fuel:driver-detail", args=[driver.pk]))

    delivery = timezone.localdate()
    try:
        expiration = delivery.replace(year=delivery.year + 1)
    except ValueError:  # Feb 29
        expiration = delivery.replace(year=delivery.year + 1, day=28)

    return Response({
        "driver": DriverDetailSerializer(driver).data,
        "card_number": card_number,
        "qr_code": qr_data_uri(profile_url),
        "barcode": barcode_data_uri(raw),
        "kd_logo": image_data_uri(settings.BASE_DIR / "logo.jpg"),
        "oss_logo": image_data_uri(settings.BASE_DIR / "oss.png"),
        "delivery": delivery,
        "expiration": expiration,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def driver_export_excel(request):
    qs, _ = driver_queryset(request)
    return build_drivers_excel(qs)


# ─── Agents / Users ───────────────────────────────────────────────────────────

class AgentViewSet(mixins.ListModelMixin, mixins.CreateModelMixin,
                    mixins.RetrieveModelMixin, mixins.UpdateModelMixin,
                    viewsets.GenericViewSet):
    serializer_class = UserAdminSerializer
    permission_classes = [ReadOnlyOrNGOAdmin]
    pagination_class = AdminPagination

    def get_queryset(self):
        # Reads are scoped rather than blocked so every role can retrieve
        # itself — that is what backs the "My history" page.
        return scope_users(self.request.user, User.objects.select_related(
            "assigned_station__company", "managed_company"
        ).order_by("role", "username"))


# ─── Fuel Types ───────────────────────────────────────────────────────────────

class FuelTypeViewSet(mixins.ListModelMixin, mixins.CreateModelMixin,
                       mixins.RetrieveModelMixin, mixins.UpdateModelMixin,
                       viewsets.GenericViewSet):
    serializer_class = FuelTypeSerializer
    # Everyone reads them (they populate filter dropdowns); admins edit them.
    permission_classes = [ReadOnlyOrNGOAdmin]
    pagination_class = None
    queryset = FuelType.objects.all().order_by("name")


# ─── Station targets ──────────────────────────────────────────────────────────

class StationTargetViewSet(mixins.ListModelMixin, mixins.CreateModelMixin,
                            mixins.RetrieveModelMixin, mixins.UpdateModelMixin,
                            mixins.DestroyModelMixin, viewsets.GenericViewSet):
    """Monthly levy targets, shown as progress bars on the dashboard.

    Unlike the other viewsets this one allows delete: a target is a planning
    figure, not a financial record, so removing a wrong one is legitimate.
    """
    serializer_class = StationTargetSerializer
    permission_classes = [ReadOnlyOrNGOAdminOrManager]
    pagination_class = AdminPagination

    def get_queryset(self):
        qs = StationTarget.objects.select_related("station__company")
        qs = qs.filter(station__in=scope_stations(self.request.user, FuelStation.objects.all()))
        for param, field in (("station", "station_id"), ("year", "year"), ("month", "month")):
            value = self.request.query_params.get(param)
            if value:
                qs = qs.filter(**{field: value})
        return qs.order_by("-year", "-month", "station__name")


# ─── Reports ──────────────────────────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([IsAuthenticated, IsNGOAdminOrManager])
def reports_api(request):
    scoped = scope_transactions(request.user, Transaction.objects.all())
    today = date.today()
    monthly = []
    for i in range(11, -1, -1):
        year = today.year
        month = today.month - i
        while month <= 0:
            month += 12
            year -= 1
        _, last_day = calendar.monthrange(year, month)
        period_start = date(year, month, 1)
        period_end = date(year, month, last_day)
        agg = scoped.filter(
            created_at__date__gte=period_start,
            created_at__date__lte=period_end,
        ).aggregate(levy=Sum("levy_amount_usd"), count=Count("id"))
        monthly.append({
            "label": period_start.strftime("%b %Y"),
            "levy": float(agg["levy"] or 0),
            "count": agg["count"] or 0,
        })

    church_summary = list(
        scoped
        .values("church__name", "church__id", "church__station__name", "church__station__company__name")
        .annotate(total_levy=Sum("levy_amount_usd"), tx_count=Count("id"))
        .order_by("-total_levy")[:20]
    )
    fuel_summary = list(
        scoped
        .values("fuel_type__name")
        .annotate(total=Sum("levy_amount_usd"), count=Count("id"))
        .order_by("-total")
    )

    stats = kpi_stats(request.user)
    stats["recent"] = TransactionSerializer(stats["recent"], many=True).data

    return Response({
        "monthly": monthly,
        "church_summary": church_summary,
        "fuel_summary": fuel_summary,
        "stats": stats,
    })


# ─── Audit Log ────────────────────────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([IsAuthenticated, IsNGOAdmin])
def audit_log_api(request):
    """Audit trail, filterable by ?q=, ?field=, ?user=, ?from=, ?to=.

    The web page returns an unfiltered newest-500 firehose; this pages and
    filters instead, since the SPA has to make it navigable.
    """
    from datetime import date

    qs = scope_audit_logs(request.user, TransactionAuditLog.objects.select_related(
        "transaction__station__company", "changed_by"
    ).order_by("-changed_at"))

    search = (request.query_params.get("q") or "").strip()
    if search:
        qs = qs.filter(transaction__receipt_code__icontains=search)
    field = (request.query_params.get("field") or "").strip()
    if field:
        qs = qs.filter(field_name=field)
    changed_by = (request.query_params.get("user") or "").strip()
    if changed_by:
        qs = qs.filter(changed_by__username__icontains=changed_by)

    def _parse(key):
        raw = (request.query_params.get(key) or "").strip()
        try:
            return date.fromisoformat(raw) if raw else None
        except ValueError:
            return None

    if (date_from := _parse("from")):
        qs = qs.filter(changed_at__date__gte=date_from)
    if (date_to := _parse("to")):
        qs = qs.filter(changed_at__date__lte=date_to)

    paginator = AdminPagination()
    page = paginator.paginate_queryset(qs, request)
    data = [
        {
            "id": log.id,
            "receipt_code": log.transaction.receipt_code,
            "company_name": log.transaction.station.company.name,
            "field_name": log.field_name,
            "old_value": log.old_value,
            "new_value": log.new_value,
            "changed_by_username": log.changed_by.username if log.changed_by else None,
            "changed_at": log.changed_at,
            "ip_address": log.ip_address,
        }
        for log in page
    ]
    return paginator.get_paginated_response(data)
