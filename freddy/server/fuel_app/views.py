from decimal import Decimal
from django.conf import settings
from django.contrib import messages
from django.contrib.auth import authenticate
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.db.models import Count, Sum
from django.http import HttpResponse, HttpResponseForbidden, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.utils import timezone
# Imported as `gettext`, not the usual `_`, because `_` is already used as a
# throwaway unpacking name in this module.
from django.utils.translation import gettext
from django.views.decorators.http import require_POST, require_http_methods
from knox.models import AuthToken
from rest_framework import status as drf_status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from authentication.models import ROLE_NGO_ADMIN, ROLE_COMPANY_MANAGER, ROLE_STATION_AGENT, User
from fuel_app.decorators import role_required
from fuel_app.forms import (
    AgentForm, ChurchForm, DisbursementForm, FuelStationForm, FuelTypeForm,
    ParentCompanyForm, StationTargetForm, TransactionFilterForm, TransactionStatusForm,
)
from fuel_app.models import (
    Church, Disbursement, Driver, ExchangeRateCache, FuelStation, FuelType,
    ParentCompany, StationTarget, Transaction, TransactionAuditLog,
)
from fuel_app.permissions import IsNGOAdmin, IsStationAgent
from fuel_app.serializers import (
    ChurchSerializer, FuelStationSerializer, FuelTypeSerializer,
    TransactionAuditLogSerializer, TransactionCreateSerializer,
    TransactionSerializer, TransactionStatusUpdateSerializer,
)
from fuel_app.services import (
    build_drivers_excel, build_transactions_excel, build_transactions_pdf,
    driver_card_number, driver_queryset, filter_history, get_usd_to_cdf_rate,
    history_summary, kpi_stats, paginate_history, qr_data_uri, image_data_uri,
    barcode_data_uri, normalize_phone, record_audit_log, scope_transactions,
    tx_queryset, money_str, DRIVER_SORTABLE, CONSUMPTION_ORDER,
)


# ─── helpers ──────────────────────────────────────────────────────────────────

def _htmx(request):
    return request.headers.get("HX-Request") == "true"


def _tx_queryset(request):
    return tx_queryset(request)


def _kpi_stats():
    return kpi_stats()


def _history_page(request, qs, per_page=25):
    """Context for the shared `fuel/partials/history.html` block.

    Same filtering and summary logic as the /api/…/history/ endpoints, so the
    dashboard and the mobile app can never disagree about an agent's totals.
    The summary covers the whole filtered set, not just the visible page.
    """
    qs = filter_history(qs, request.GET).order_by("-created_at")
    page_obj = Paginator(qs, per_page).get_page(request.GET.get("page"))
    filters = request.GET.copy()
    filters.pop("page", None)
    return {
        "history": page_obj.object_list,
        "summary": history_summary(qs),
        "page_obj": page_obj,
        "page_range": page_obj.paginator.get_elided_page_range(
            page_obj.number, on_each_side=2, on_ends=1
        ),
        "querystring": filters.urlencode(),
        "history_filters": {k: request.GET.get(k, "") for k in ("from", "to", "status")},
        "status_choices": Transaction.Status.choices,
    }


# ─── Dashboard ────────────────────────────────────────────────────────────────

@login_required
def dashboard(request):
    from django.db.models import F, Q
    today = timezone.now().date()
    month_start = today.replace(day=1)
    top_stations = list(
        FuelStation.objects.filter(is_active=True)
        .select_related("company")
        .annotate(month_levy=Sum(
            "transactions__levy_amount_usd",
            filter=Q(transactions__created_at__date__gte=month_start),
        ))
        .order_by(F("month_levy").desc(nulls_last=True))[:6]
    )
    targets = {
        t.station_id: t.target_usd
        for t in StationTarget.objects.filter(year=today.year, month=today.month)
    }
    for s in top_stations:
        s.month_levy = s.month_levy or 0
        s.target_usd = targets.get(s.id)
        s.target_pct = (
            min(100, round(float(s.month_levy) / float(s.target_usd) * 100))
            if s.target_usd else None
        )
    return render(request, "fuel/dashboard.html", {
        "stats": _kpi_stats(),
        "rate": get_usd_to_cdf_rate(),
        "companies": ParentCompany.objects.filter(is_active=True),
        "top_stations": top_stations,
    })


@login_required
def dashboard_stats_partial(request):
    return render(request, "fuel/partials/stats_cards.html", {"stats": _kpi_stats()})


@login_required
def dashboard_chart_data(request):
    """JSON endpoint for Chart.js — levy per day over ?days= (default 30)."""
    from datetime import timedelta
    try:
        days = int(request.GET.get("days", 30))
    except (TypeError, ValueError):
        days = 30
    days = max(2, min(days, 365))
    today = timezone.now().date()
    data = []
    for i in range(days - 1, -1, -1):
        d = today - timedelta(days=i)
        amt = Transaction.objects.filter(created_at__date=d).aggregate(t=Sum("levy_amount_usd"))["t"] or 0
        data.append({"date": d.strftime("%d %b"), "amount": float(amt)})
    return JsonResponse({"data": data})


# ─── Transactions ─────────────────────────────────────────────────────────────

@login_required
def transactions_list(request):
    qs = _tx_queryset(request)
    form = TransactionFilterForm(request.GET)
    totals = qs.aggregate(levy=Sum("levy_amount_usd"), count=Count("id"))
    page_obj = Paginator(qs, 50).get_page(request.GET.get("page"))
    filters = request.GET.copy()
    filters.pop("page", None)
    ctx = {
        "transactions": page_obj.object_list,
        "page_obj": page_obj,
        "page_range": page_obj.paginator.get_elided_page_range(page_obj.number, on_each_side=2, on_ends=1),
        "querystring": filters.urlencode(),
        "form": form,
        "totals": totals,
        "companies": ParentCompany.objects.filter(is_active=True),
        "stations": FuelStation.objects.filter(is_active=True).select_related("company"),
    }
    if _htmx(request):
        return render(request, "fuel/partials/tx_table.html", ctx)
    return render(request, "fuel/transactions/index.html", ctx)


@login_required
def transaction_detail(request, pk):
    tx = get_object_or_404(Transaction.objects.select_related(
        "station__company", "church", "agent", "fuel_type"
    ), pk=pk)
    audit_logs = tx.audit_logs.select_related("changed_by").all()
    form = TransactionStatusForm(instance=tx)
    return render(request, "fuel/transactions/detail.html", {
        "tx": tx, "audit_logs": audit_logs, "form": form,
    })


@login_required
@require_POST
def transaction_update_status(request, pk):
    tx = get_object_or_404(Transaction, pk=pk)
    form = TransactionStatusForm(request.POST, instance=tx)
    if form.is_valid():
        for field in ["status", "notes"]:
            if field in form.changed_data:
                record_audit_log(tx, request.user, field,
                                 getattr(tx, field), form.cleaned_data[field], request)
        form.save()
        messages.success(request, f"Transaction {tx.receipt_code} updated.")
        if _htmx(request):
            return render(request, "fuel/partials/tx_status_badge.html", {"tx": tx})
    return redirect("fuel:tx-detail", pk=pk)


@role_required(ROLE_NGO_ADMIN)
@require_POST
def transaction_bulk_action(request):
    ids = request.POST.getlist("selected")
    action = request.POST.get("action")
    STATUS_MAP = {"verify": Transaction.Status.VERIFIED, "remit": Transaction.Status.REMITTED}
    if action in STATUS_MAP and ids:
        qs = Transaction.objects.filter(pk__in=ids)
        for tx in qs:
            old = tx.status
            tx.status = STATUS_MAP[action]
            tx.save()
            record_audit_log(tx, request.user, "status", old, tx.status, request)
        messages.success(request, f"{qs.count()} transactions updated.")
    return redirect("fuel:transactions")


# ─── Companies ────────────────────────────────────────────────────────────────

@role_required(ROLE_NGO_ADMIN)
def company_list(request):
    qs = ParentCompany.objects.annotate(
        station_count=Count("stations", distinct=True),
        tx_count=Count("stations__transactions", distinct=True),
        total_levy=Sum("stations__transactions__levy_amount_usd"),
    ).order_by("name")
    return render(request, "fuel/companies/index.html", {"companies": qs})


@role_required(ROLE_NGO_ADMIN)
def company_create(request):
    form = ParentCompanyForm(request.POST or None, request.FILES or None)
    if request.method == "POST" and form.is_valid():
        company = form.save()
        messages.success(request, f'Company "{company.name}" created.')
        if _htmx(request):
            return render(request, "fuel/partials/company_row.html", {"company": company})
        return redirect("fuel:companies")
    return render(request, "fuel/companies/form.html", {"form": form, "title": "New Company"})


@role_required(ROLE_NGO_ADMIN)
def company_edit(request, pk):
    company = get_object_or_404(ParentCompany, pk=pk)
    form = ParentCompanyForm(request.POST or None, request.FILES or None, instance=company)
    if request.method == "POST" and form.is_valid():
        form.save()
        messages.success(request, f'Company "{company.name}" updated.')
        if _htmx(request):
            return render(request, "fuel/partials/company_row.html", {"company": company})
        return redirect("fuel:companies")
    return render(request, "fuel/companies/form.html", {"form": form, "company": company, "title": "Edit Company"})


@login_required
def company_detail(request, pk):
    company = get_object_or_404(ParentCompany, pk=pk)
    stations = company.stations.filter(is_active=True).annotate(
        tx_count=Count("transactions"), total_levy=Sum("transactions__levy_amount_usd")
    ).prefetch_related("churches")
    totals = Transaction.objects.filter(station__company=company).aggregate(
        total_usd=Sum("levy_amount_usd"), tx_count=Count("id")
    )
    if _htmx(request):
        return render(request, "fuel/partials/company_detail.html", {
            "company": company, "stations": stations, "totals": totals,
        })
    return render(request, "fuel/companies/detail.html", {
        "company": company, "stations": stations, "totals": totals,
    })


# ─── Stations ─────────────────────────────────────────────────────────────────

@role_required(ROLE_NGO_ADMIN, ROLE_COMPANY_MANAGER)
def station_list(request):
    qs = FuelStation.objects.select_related("company").annotate(
        church_count=Count("churches", distinct=True),
        tx_count=Count("transactions", distinct=True),
        total_levy=Sum("transactions__levy_amount_usd"),
    ).order_by("company__name", "name")
    company_id = request.GET.get("company")
    if company_id:
        qs = qs.filter(company_id=company_id)
    return render(request, "fuel/stations/index.html", {
        "stations": qs,
        "companies": ParentCompany.objects.filter(is_active=True),
        "selected_company": company_id,
    })


@role_required(ROLE_NGO_ADMIN, ROLE_COMPANY_MANAGER)
def station_create(request):
    form = FuelStationForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        station = form.save()
        messages.success(request, f'Station "{station.name}" created.')
        return redirect("fuel:stations")
    return render(request, "fuel/stations/form.html", {"form": form, "title": "New Station"})


@role_required(ROLE_NGO_ADMIN, ROLE_COMPANY_MANAGER)
def station_edit(request, pk):
    station = get_object_or_404(FuelStation, pk=pk)
    form = FuelStationForm(request.POST or None, instance=station)
    if request.method == "POST" and form.is_valid():
        form.save()
        messages.success(request, f'Station "{station.name}" updated.')
        return redirect("fuel:stations")
    return render(request, "fuel/stations/form.html", {"form": form, "station": station, "title": "Edit Station"})


@login_required
def station_detail_view(request, pk):
    station = get_object_or_404(FuelStation.objects.select_related("company"), pk=pk)
    churches = station.churches.filter(is_active=True)
    totals = station.transactions.aggregate(total_usd=Sum("levy_amount_usd"), tx_count=Count("id"))

    # The HTMX drawer on the stations list stays a short preview; only the
    # standalone page pays for the full paginated history.
    if _htmx(request):
        recent_txs = station.transactions.select_related("church", "agent", "fuel_type")[:20]
        return render(request, "fuel/partials/station_detail.html", {
            "station": station, "churches": churches, "recent_txs": recent_txs, "totals": totals,
        })

    txs = scope_transactions(
        request.user,
        Transaction.objects.filter(station=station).select_related(
            "station__company", "church", "agent", "fuel_type"
        ),
    )
    ctx = {"station": station, "churches": churches, "totals": totals, "hide_station": True}
    ctx.update(_history_page(request, txs))
    ctx["by_agent"] = (
        filter_history(txs, request.GET)
        .values("agent_id", "agent__username")
        .annotate(count=Count("id"), levy=Sum("levy_amount_usd"))
        .order_by("-levy")
    )
    return render(request, "fuel/stations/detail.html", ctx)


# ─── Churches ─────────────────────────────────────────────────────────────────

@role_required(ROLE_NGO_ADMIN, ROLE_COMPANY_MANAGER)
def church_list(request):
    qs = Church.objects.select_related("station__company").annotate(
        tx_count=Count("transactions"), total_levy=Sum("transactions__levy_amount_usd"),
        disburse_count=Count("disbursements"),
    ).order_by("station__company__name", "station__name", "name")
    return render(request, "fuel/churches/index.html", {"churches": qs})


@role_required(ROLE_NGO_ADMIN, ROLE_COMPANY_MANAGER)
def church_create(request):
    form = ChurchForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        church = form.save()
        messages.success(request, f'Church "{church.name}" created.')
        return redirect("fuel:churches")
    return render(request, "fuel/churches/form.html", {"form": form, "title": "New Church"})


@role_required(ROLE_NGO_ADMIN, ROLE_COMPANY_MANAGER)
def church_edit(request, pk):
    church = get_object_or_404(Church, pk=pk)
    form = ChurchForm(request.POST or None, instance=church)
    if request.method == "POST" and form.is_valid():
        form.save()
        messages.success(request, f'Church "{church.name}" updated.')
        return redirect("fuel:churches")
    return render(request, "fuel/churches/form.html", {"form": form, "church": church, "title": "Edit Church"})


@login_required
def church_detail(request, pk):
    church = get_object_or_404(Church.objects.select_related("station__company"), pk=pk)
    txs = church.transactions.select_related("agent", "fuel_type").order_by("-created_at")[:30]
    disbursements = church.disbursements.order_by("-created_at")[:10]
    totals = church.transactions.aggregate(levy=Sum("levy_amount_usd"), count=Count("id"))
    return render(request, "fuel/churches/detail.html", {
        "church": church, "txs": txs, "disbursements": disbursements, "totals": totals,
    })


# ─── Drivers (OSS registrations) ──────────────────────────────────────────────

def _driver_queryset(request):
    return driver_queryset(request)


@login_required
def driver_list(request):
    base_qs, cur = _driver_queryset(request)

    # ── Sorting ──
    sort = request.GET.get("sort", "name")
    direction = request.GET.get("dir", "asc")
    order_field = DRIVER_SORTABLE.get(sort, "full_name")
    qs = base_qs.order_by(order_field if direction == "asc" else f"-{order_field}")

    paginator = Paginator(qs, 50)
    page_obj = paginator.get_page(request.GET.get("page"))

    def _opts(field):
        return sorted(v for v in Driver.objects.values_list(field, flat=True).distinct() if v)

    # ── Insights (reflect the active filters) ──
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
        "filtered": paginator.count,
        "total": Driver.objects.count(),
        "top_vehicle": top_vehicle[0], "top_vehicle_n": top_vehicle[1],
        "coverage_pct": round(100 * health["yes"] / covered) if covered else 0,
        "agents": (agg.exclude(field_agent__isnull=True).exclude(field_agent="")
                   .values("field_agent").distinct().count()),
    }

    cons_map = dict(_breakdown("daily_fuel_consumption"))
    consumption = [[k, cons_map[k]] for k in CONSUMPTION_ORDER if k in cons_map]
    consumption += [[k, v] for k, v in cons_map.items() if k not in CONSUMPTION_ORDER]

    # ── Active-filter chips ──
    chips = []
    for key, val in cur.items():
        if val:
            rem = request.GET.copy()
            rem.pop(key, None)
            rem.pop("page", None)
            chips.append({"value": val, "qs": rem.urlencode()})

    params = request.GET.copy()
    params.pop("page", None)
    sort_params = request.GET.copy()
    for p in ("sort", "dir", "page"):
        sort_params.pop(p, None)

    return render(request, "fuel/drivers/index.html", {
        "page_obj": page_obj,
        "page_range": page_obj.paginator.get_elided_page_range(page_obj.number, on_each_side=2, on_ends=1),
        "total_count": kpi["total"],
        "filtered_count": paginator.count,
        "communes": _opts("commune"),
        "vehicle_types": _opts("vehicle_type"),
        "fuel_types": _opts("fuel_type"),
        "agents": _opts("field_agent"),
        "cur": cur,
        "chips": chips,
        "querystring": params.urlencode(),
        "sort_querystring": sort_params.urlencode(),
        "sort": sort, "dir": direction,
        "kpi": kpi,
        "chart_commune": _breakdown("commune", 8),
        "chart_vehicle": vehicle_bd,
        "chart_consumption": consumption,
        "chart_health": [health["yes"], health["no"], health["unknown"]],
    })


@login_required
def driver_detail(request, pk):
    driver = get_object_or_404(Driver, pk=pk)
    profile_url = request.build_absolute_uri(
        reverse("fuel:driver-detail", args=[driver.pk])
    )
    return render(
        request,
        "fuel/drivers/detail.html",
        {"driver": driver, "qr_code": qr_data_uri(profile_url), "profile_url": profile_url},
    )


@login_required
def driver_id_card(request, pk):
    driver = get_object_or_404(Driver, pk=pk)
    raw, card_number = driver_card_number(driver)
    profile_url = request.build_absolute_uri(
        reverse("fuel:driver-detail", args=[driver.pk])
    )

    # 1-year validity from today.
    delivery = timezone.localdate()
    try:
        expiration = delivery.replace(year=delivery.year + 1)
    except ValueError:  # Feb 29
        expiration = delivery.replace(year=delivery.year + 1, day=28)

    return render(
        request,
        "fuel/drivers/id_card.html",
        {
            "driver": driver,
            "card_number": card_number,
            "qr_code": qr_data_uri(profile_url),
            "barcode": barcode_data_uri(raw),
            "kd_logo": image_data_uri(settings.BASE_DIR / "logo.jpg"),
            "oss_logo": image_data_uri(settings.BASE_DIR / "oss.png"),
            "delivery": delivery,
            "expiration": expiration,
        },
    )


@login_required
def export_drivers_excel(request):
    qs, _ = _driver_queryset(request)
    return build_drivers_excel(qs)


# ─── Agents / Users ───────────────────────────────────────────────────────────

@role_required(ROLE_NGO_ADMIN)
def agent_list(request):
    users = User.objects.select_related("assigned_station__company", "managed_company").order_by("role", "username")
    return render(request, "fuel/agents/index.html", {"users": users})


@role_required(ROLE_NGO_ADMIN)
def agent_create(request):
    form = AgentForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        user = form.save()
        messages.success(request, f'User "{user.username}" created.')
        return redirect("fuel:agents")
    return render(request, "fuel/agents/form.html", {"form": form, "title": "New User"})


@login_required
def agent_detail(request, pk):
    """An agent's profile plus their full levy history.

    Deliberately not admin-only: an agent can always open their own page, so
    a station agent has somewhere on the dashboard to review everything they
    have recorded. Reading someone *else's* page follows the same rule as the
    API — NGO admins anyone, company managers their own company's agents.
    """
    agent = get_object_or_404(
        User.objects.select_related("assigned_station__company", "managed_company"), pk=pk
    )
    if agent != request.user and not _can_read_agent(request.user, agent):
        return HttpResponseForbidden(gettext("You do not have access to this agent's history."))

    txs = Transaction.objects.filter(agent=agent).select_related(
        "station__company", "church", "agent", "fuel_type"
    )
    if agent != request.user:
        txs = scope_transactions(request.user, txs)

    ctx = {"agent_obj": agent, "is_self": agent == request.user, "hide_agent": True}
    ctx.update(_history_page(request, txs))
    return render(request, "fuel/agents/detail.html", ctx)


@role_required(ROLE_NGO_ADMIN)
def agent_edit(request, pk):
    user = get_object_or_404(User, pk=pk)
    form = AgentForm(request.POST or None, instance=user)
    if request.method == "POST" and form.is_valid():
        form.save()
        messages.success(request, f'User "{user.username}" updated.')
        return redirect("fuel:agents")
    return render(request, "fuel/agents/form.html", {"form": form, "user_obj": user, "title": "Edit User"})


# ─── Disbursements ────────────────────────────────────────────────────────────

@role_required(ROLE_NGO_ADMIN)
def disbursement_list(request):
    qs = Disbursement.objects.select_related("church__station__company", "prepared_by").order_by("-created_at")
    status_filter = request.GET.get("status")
    if status_filter:
        qs = qs.filter(status=status_filter)
    totals = qs.aggregate(total=Sum("amount_usd"), count=Count("id"))
    return render(request, "fuel/disbursements/index.html", {
        "disbursements": qs[:200],
        "totals": totals,
        "statuses": Disbursement.Status.choices,
        "status_filter": status_filter,
    })


@role_required(ROLE_NGO_ADMIN)
def disbursement_create(request):
    form = DisbursementForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        d = form.save(commit=False)
        d.prepared_by = request.user
        d.save()
        messages.success(request, f"Disbursement {d.reference} created.")
        return redirect("fuel:disbursements")
    return render(request, "fuel/disbursements/form.html", {"form": form, "title": "New Disbursement"})


@role_required(ROLE_NGO_ADMIN)
def disbursement_edit(request, pk):
    d = get_object_or_404(Disbursement, pk=pk)
    form = DisbursementForm(request.POST or None, instance=d)
    if request.method == "POST" and form.is_valid():
        form.save()
        if form.cleaned_data["status"] == Disbursement.Status.PAID and not d.paid_at:
            d.paid_at = timezone.now()
            d.save()
        messages.success(request, f"Disbursement {d.reference} updated.")
        return redirect("fuel:disbursements")
    return render(request, "fuel/disbursements/form.html", {"form": form, "disburse": d, "title": "Edit Disbursement"})


@role_required(ROLE_NGO_ADMIN)
@require_POST
def disbursement_mark_paid(request, pk):
    d = get_object_or_404(Disbursement, pk=pk)
    d.status = Disbursement.Status.PAID
    d.paid_at = timezone.now()
    d.save()
    messages.success(request, f"{d.reference} marked as paid.")
    if _htmx(request):
        return render(request, "fuel/partials/disburse_row.html", {"d": d})
    return redirect("fuel:disbursements")


# ─── Reports ──────────────────────────────────────────────────────────────────

@role_required(ROLE_NGO_ADMIN, ROLE_COMPANY_MANAGER)
def reports(request):
    # Monthly levy roll-up for the past 12 months
    from datetime import date
    import calendar
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
        agg = Transaction.objects.filter(
            created_at__date__gte=period_start,
            created_at__date__lte=period_end,
        ).aggregate(levy=Sum("levy_amount_usd"), count=Count("id"))
        monthly.append({
            "label": period_start.strftime("%b %Y"),
            "levy": float(agg["levy"] or 0),
            "count": agg["count"] or 0,
        })

    # Per-church summary
    church_summary = list(
        Transaction.objects
        .values("church__name", "church__id", "church__station__name", "church__station__company__name")
        .annotate(total_levy=Sum("levy_amount_usd"), tx_count=Count("id"))
        .order_by("-total_levy")[:20]
    )

    # Per-fuel-type
    fuel_summary = list(
        Transaction.objects
        .values("fuel_type__name")
        .annotate(total=Sum("levy_amount_usd"), count=Count("id"))
        .order_by("-total")
    )

    return render(request, "fuel/reports/index.html", {
        "monthly": monthly,
        "church_summary": church_summary,
        "fuel_summary": fuel_summary,
        "stats": _kpi_stats(),
    })


# ─── Audit Log ────────────────────────────────────────────────────────────────

@role_required(ROLE_NGO_ADMIN)
def audit_log_list(request):
    qs = TransactionAuditLog.objects.select_related(
        "transaction__station__company", "changed_by"
    ).order_by("-changed_at")
    return render(request, "fuel/audit/index.html", {"logs": qs[:500]})


# ─── Fuel Types ───────────────────────────────────────────────────────────────

@role_required(ROLE_NGO_ADMIN)
def fuel_type_list(request):
    types = FuelType.objects.all()
    return render(request, "fuel/settings/fuel_types.html", {"types": types})


@role_required(ROLE_NGO_ADMIN)
def fuel_type_create(request):
    form = FuelTypeForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        ft = form.save()
        messages.success(request, f'Fuel type "{ft.name}" added.')
        if _htmx(request):
            return render(request, "fuel/partials/fuel_type_row.html", {"ft": ft})
        return redirect("fuel:fuel-types")
    if _htmx(request):
        return render(request, "fuel/partials/fuel_type_form.html", {"form": form})
    return render(request, "fuel/settings/fuel_types.html", {
        "types": FuelType.objects.all(), "form": form,
    })


@role_required(ROLE_NGO_ADMIN)
def fuel_type_edit(request, pk):
    ft = get_object_or_404(FuelType, pk=pk)
    form = FuelTypeForm(request.POST or None, instance=ft)
    if request.method == "POST" and form.is_valid():
        form.save()
        messages.success(request, f'Fuel type "{ft.name}" updated.')
        if _htmx(request):
            return render(request, "fuel/partials/fuel_type_row.html", {"ft": ft})
        return redirect("fuel:fuel-types")
    if _htmx(request):
        return render(request, "fuel/partials/fuel_type_form.html", {"form": form, "ft": ft})
    return render(request, "fuel/settings/fuel_types.html", {
        "types": FuelType.objects.all(), "form": form, "editing": ft,
    })


# ─── Verify (public) ──────────────────────────────────────────────────────────

def verify_receipt_page(request):
    code = request.GET.get("code", "").strip().upper()
    tx = None
    if code:
        tx = Transaction.objects.filter(receipt_code=code).select_related(
            "station__company", "church", "agent", "fuel_type"
        ).first()
    if _htmx(request):
        return render(request, "fuel/partials/verify_result.html", {"tx": tx, "code": code})
    return render(request, "fuel/verify.html", {"tx": tx, "code": code})


# ─── Export ───────────────────────────────────────────────────────────────────

@login_required
def export_excel(request):
    return build_transactions_excel(_tx_queryset(request))


@login_required
def export_pdf(request):
    return build_transactions_pdf(_tx_queryset(request))


# ─── REST API ──────────────────────────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_currency_rate(request):
    return Response({"usd_to_cdf": str(get_usd_to_cdf_rate())})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_fuel_types(request):
    return Response(FuelTypeSerializer(FuelType.objects.filter(is_active=True), many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_stations(request):
    return Response(FuelStationSerializer(
        FuelStation.objects.filter(is_active=True).select_related("company"), many=True
    ).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_churches(request):
    qs = Church.objects.filter(is_active=True).select_related("station__company")
    station_id = request.query_params.get("station")
    if station_id:
        qs = qs.filter(station_id=station_id)
    elif request.user.role == ROLE_STATION_AGENT and request.user.assigned_station:
        qs = qs.filter(station=request.user.assigned_station)
    return Response(ChurchSerializer(qs, many=True).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsStationAgent])
def api_transaction_create(request):
    serializer = TransactionCreateSerializer(data=request.data, context={"request": request})
    if serializer.is_valid():
        tx = serializer.save()
        return Response(TransactionSerializer(tx).data, status=drf_status.HTTP_201_CREATED)
    return Response(serializer.errors, status=drf_status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_transaction_list(request):
    qs = Transaction.objects.select_related("station__company", "church", "agent", "fuel_type")
    user = request.user
    if user.role == ROLE_STATION_AGENT:
        qs = qs.filter(station=user.assigned_station) if user.assigned_station else qs.none()
    elif user.role == ROLE_COMPANY_MANAGER:
        qs = qs.filter(station__company=user.managed_company) if user.managed_company else qs.none()
    return Response(TransactionSerializer(qs[:200], many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_transaction_verify(request, receipt_code):
    tx = get_object_or_404(Transaction, receipt_code=receipt_code)
    return Response({
        "receipt_code": tx.receipt_code, "station": tx.station.name,
        "company": tx.station.company.name, "church": tx.church.name,
        "amount_usd": str(tx.amount_usd), "levy_usd": str(tx.levy_amount_usd),
        "status": tx.status, "created_at": tx.created_at, "valid": True,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_driver_detail(request, pk):
    """Driver profile + their levy history, for the mobile QR-scan lookup.

    Transactions are matched loosely by normalized phone (see
    ``normalize_phone``) because there is no hard FK from Transaction to
    Driver. Visibility is scoped the same way as the transaction list so an
    agent only sees levies from their own station.
    """
    driver = get_object_or_404(Driver, pk=pk)
    phone = normalize_phone(driver.phone)

    txs = Transaction.objects.none()
    if phone:
        txs = (
            Transaction.objects.filter(driver_phone=phone)
            .select_related("station__company", "church", "fuel_type", "agent")
            .order_by("-created_at")
        )
        user = request.user
        if user.role == ROLE_STATION_AGENT:
            txs = txs.filter(station=user.assigned_station) if user.assigned_station else txs.none()
        elif user.role == ROLE_COMPANY_MANAGER:
            txs = txs.filter(station__company=user.managed_company) if user.managed_company else txs.none()

    agg = txs.aggregate(
        count=Count("id"),
        total_levy_usd=Sum("levy_amount_usd"),
        total_amount_usd=Sum("amount_usd"),
    )

    return Response({
        "driver": {
            "id": str(driver.id),
            "full_name": driver.full_name,
            "phone": driver.phone,
            "gender": driver.gender,
            "commune": driver.commune,
            "quartier": driver.quartier,
            "vehicle_type": driver.vehicle_type,
            "vehicle_color": driver.vehicle_color,
            "fuel_type": driver.fuel_type,
        },
        "transactions": TransactionSerializer(txs[:100], many=True).data,
        "summary": {
            "count": agg["count"] or 0,
            "total_levy_usd": str(agg["total_levy_usd"] or 0),
            "total_amount_usd": str(agg["total_amount_usd"] or 0),
        },
    })


def _history_payload(request, qs):
    """Shared envelope for the history endpoints: summary + one page of rows.

    ``qs`` must already be filtered. The summary is computed over the whole
    filtered set, not just the page, so an agent sees their true running
    totals however deep they scroll.
    """
    payload = {"summary": history_summary(qs)}
    payload.update(paginate_history(qs, request, TransactionSerializer))
    return payload


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_agent_history(request, pk=None):
    """Every transaction an agent has recorded, newest first.

    ``pk`` omitted means the caller ("me"), which any authenticated user may
    read. Reading *another* agent's history is limited to NGO admins and to
    company managers whose company owns that agent's station.
    """
    if pk is None:
        agent = request.user
    else:
        agent = get_object_or_404(User, pk=pk)
        if agent != request.user and not _can_read_agent(request.user, agent):
            return Response(
                {"detail": "You do not have access to this agent's history."},
                status=drf_status.HTTP_403_FORBIDDEN,
            )

    qs = Transaction.objects.filter(agent=agent).select_related(
        "station__company", "church", "agent", "fuel_type"
    )
    # An agent always sees their own work; anyone else is scoped as usual.
    if agent != request.user:
        qs = scope_transactions(request.user, qs)
    qs = filter_history(qs, request.query_params).order_by("-created_at")

    payload = {
        "agent": {
            "id": str(agent.id),
            "username": agent.username,
            "full_name": " ".join(filter(None, [agent.firstname, agent.lastname])) or None,
            "role": agent.role,
            "station": str(agent.assigned_station_id) if agent.assigned_station_id else None,
            "station_name": agent.assigned_station.name if agent.assigned_station_id else None,
        },
    }
    payload.update(_history_payload(request, qs))
    return Response(payload)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_station_history(request, pk=None):
    """Every transaction recorded at a station, newest first.

    ``pk`` omitted means the caller's assigned station. Access is the same
    role scoping used everywhere else: admins any station, managers their
    company's, agents only the station they are assigned to.
    """
    if pk is None:
        station = request.user.assigned_station
        if station is None:
            return Response(
                {"detail": "Your account has no assigned station."},
                status=drf_status.HTTP_400_BAD_REQUEST,
            )
    else:
        station = get_object_or_404(FuelStation, pk=pk)

    qs = Transaction.objects.filter(station=station).select_related(
        "station__company", "church", "agent", "fuel_type"
    )
    scoped = scope_transactions(request.user, qs)
    # An empty scope on a station that *has* transactions means it isn't theirs.
    if pk is not None and not scoped.exists() and qs.exists():
        return Response(
            {"detail": "You do not have access to this station's history."},
            status=drf_status.HTTP_403_FORBIDDEN,
        )

    scoped = filter_history(scoped, request.query_params).order_by("-created_at")

    payload = {
        "station": {
            "id": str(station.id),
            "name": station.name,
            "code": station.code,
            "company": station.company.name,
        },
        "by_agent": [
            {
                "agent": str(row["agent_id"]),
                "username": row["agent__username"],
                "count": row["count"],
                "levy_usd": money_str(row["levy"], "0.0001"),
            }
            for row in scoped.values("agent_id", "agent__username")
            .annotate(count=Count("id"), levy=Sum("levy_amount_usd"))
            .order_by("-levy")
        ],
    }
    payload.update(_history_payload(request, scoped))
    return Response(payload)


def _can_read_agent(user, agent):
    """May `user` read another user's transaction history?"""
    if user.is_superuser or user.role == ROLE_NGO_ADMIN:
        return True
    if user.role == ROLE_COMPANY_MANAGER and user.managed_company_id:
        return (
            agent.assigned_station_id is not None
            and agent.assigned_station.company_id == user.managed_company_id
        )
    return False


@api_view(["PATCH"])
@permission_classes([IsAuthenticated, IsNGOAdmin])
def api_transaction_status(request, pk):
    tx = get_object_or_404(Transaction, pk=pk)
    serializer = TransactionStatusUpdateSerializer(tx, data=request.data, partial=True)
    if serializer.is_valid():
        for field in ["status", "amount_usd", "amount_cdf"]:
            if field in serializer.validated_data:
                old_val = getattr(tx, field)
                new_val = serializer.validated_data[field]
                if str(old_val) != str(new_val):
                    record_audit_log(tx, request.user, field, old_val, new_val, request)
        serializer.save()
        return Response(TransactionSerializer(tx).data)
    return Response(serializer.errors, status=drf_status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsStationAgent])
def api_bulk_sync(request):
    results = []
    for tx_data in request.data.get("transactions", []):
        sync_id = tx_data.get("sync_id")
        if sync_id and Transaction.objects.filter(sync_id=sync_id).exists():
            results.append({"sync_id": sync_id, "status": "duplicate"})
            continue
        s = TransactionCreateSerializer(data=tx_data, context={"request": request})
        if s.is_valid():
            tx = s.save()
            results.append({"sync_id": sync_id, "receipt_code": tx.receipt_code, "levy_amount_usd": str(tx.levy_amount_usd), "status": "created"})
        else:
            results.append({"sync_id": sync_id, "errors": s.errors, "status": "error"})
    return Response({"results": results})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_audit_log(request, pk):
    tx = get_object_or_404(Transaction, pk=pk)
    return Response(TransactionAuditLogSerializer(tx.audit_logs.all(), many=True).data)


@api_view(["POST"])
@permission_classes([AllowAny])
def api_login(request):
    """JSON username/password login for the mobile app.

    Knox's bundled LoginView authenticates with the global
    DEFAULT_AUTHENTICATION_CLASSES (here, token-only), so it can't accept a
    username/password body. This endpoint authenticates the credentials and
    issues a Knox token in the same ``{token, expiry}`` shape the app expects.
    """
    username = request.data.get("username", "")
    password = request.data.get("password", "")
    user = authenticate(request, username=username, password=password)
    if user is None:
        return Response({"detail": "Invalid username or password."},
                        status=drf_status.HTTP_401_UNAUTHORIZED)
    if not user.is_active:
        return Response({"detail": "This account is inactive."},
                        status=drf_status.HTTP_403_FORBIDDEN)
    instance, token = AuthToken.objects.create(user)
    return Response({"token": token, "expiry": instance.expiry})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_profile(request):
    user = request.user
    return Response({
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "assigned_station": str(user.assigned_station_id) if user.assigned_station_id else None,
        "managed_company": str(user.managed_company_id) if user.managed_company_id else None,
    })
