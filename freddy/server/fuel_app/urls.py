from django.urls import path
from fuel_app import views

app_name = "fuel"

urlpatterns = [
    # ── Dashboard ────────────────────────────────────────────────────────
    path("", views.dashboard, name="dashboard"),
    path("dashboard/stats/", views.dashboard_stats_partial, name="dashboard-stats"),
    path("dashboard/chart-data/", views.dashboard_chart_data, name="dashboard-chart-data"),

    # ── Transactions ─────────────────────────────────────────────────────
    path("transactions/", views.transactions_list, name="transactions"),
    path("transactions/<uuid:pk>/", views.transaction_detail, name="tx-detail"),
    path("transactions/<uuid:pk>/status/", views.transaction_update_status, name="tx-status"),
    path("transactions/bulk/", views.transaction_bulk_action, name="tx-bulk"),

    # ── Companies ────────────────────────────────────────────────────────
    path("companies/", views.company_list, name="companies"),
    path("companies/new/", views.company_create, name="company-create"),
    path("companies/<uuid:pk>/", views.company_detail, name="company-detail"),
    path("companies/<uuid:pk>/edit/", views.company_edit, name="company-edit"),

    # ── Stations ─────────────────────────────────────────────────────────
    path("stations/", views.station_list, name="stations"),
    path("stations/new/", views.station_create, name="station-create"),
    path("stations/<uuid:pk>/", views.station_detail_view, name="station-detail"),
    path("stations/<uuid:pk>/edit/", views.station_edit, name="station-edit"),

    # ── Churches ─────────────────────────────────────────────────────────
    path("churches/", views.church_list, name="churches"),
    path("churches/new/", views.church_create, name="church-create"),
    path("churches/<uuid:pk>/", views.church_detail, name="church-detail"),
    path("churches/<uuid:pk>/edit/", views.church_edit, name="church-edit"),

    # ── Drivers ───────────────────────────────────────────────────────────
    path("drivers/", views.driver_list, name="drivers"),
    path("drivers/export/excel/", views.export_drivers_excel, name="drivers-export-excel"),
    path("drivers/<uuid:pk>/", views.driver_detail, name="driver-detail"),

    # ── Agents / Users ────────────────────────────────────────────────────
    path("agents/", views.agent_list, name="agents"),
    path("agents/new/", views.agent_create, name="agent-create"),
    path("agents/<uuid:pk>/edit/", views.agent_edit, name="agent-edit"),

    # ── Disbursements ─────────────────────────────────────────────────────
    path("disbursements/", views.disbursement_list, name="disbursements"),
    path("disbursements/new/", views.disbursement_create, name="disbursement-create"),
    path("disbursements/<uuid:pk>/edit/", views.disbursement_edit, name="disbursement-edit"),
    path("disbursements/<uuid:pk>/pay/", views.disbursement_mark_paid, name="disbursement-pay"),

    # ── Reports ───────────────────────────────────────────────────────────
    path("reports/", views.reports, name="reports"),

    # ── Audit ─────────────────────────────────────────────────────────────
    path("audit/", views.audit_log_list, name="audit"),

    # ── Settings ──────────────────────────────────────────────────────────
    path("settings/fuel-types/", views.fuel_type_list, name="fuel-types"),
    path("settings/fuel-types/new/", views.fuel_type_create, name="fuel-type-create"),
    path("settings/fuel-types/<uuid:pk>/edit/", views.fuel_type_edit, name="fuel-type-edit"),

    # ── Verify (no login required) ────────────────────────────────────────
    path("verify/", views.verify_receipt_page, name="verify"),

    # ── Exports ───────────────────────────────────────────────────────────
    path("export/excel/", views.export_excel, name="export-excel"),
    path("export/pdf/", views.export_pdf, name="export-pdf"),

    # ── REST API ──────────────────────────────────────────────────────────
    path("api/currency/", views.api_currency_rate, name="api-currency"),
    path("api/fuel-types/", views.api_fuel_types, name="api-fuel-types"),
    path("api/stations/", views.api_stations, name="api-stations"),
    path("api/churches/", views.api_churches, name="api-churches"),
    path("api/transactions/", views.api_transaction_list, name="api-tx-list"),
    path("api/transactions/create/", views.api_transaction_create, name="api-tx-create"),
    path("api/transactions/sync/", views.api_bulk_sync, name="api-tx-sync"),
    path("api/transactions/<uuid:pk>/status/", views.api_transaction_status, name="api-tx-status"),
    path("api/transactions/<uuid:pk>/audit/", views.api_audit_log, name="api-tx-audit"),
    path("api/verify/<str:receipt_code>/", views.api_transaction_verify, name="api-verify"),
    path("api/auth/profile/", views.api_profile, name="api-profile"),
]
