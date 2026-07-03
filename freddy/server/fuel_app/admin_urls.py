from django.urls import include, path
from rest_framework.routers import DefaultRouter

from fuel_app import admin_views as v

app_name = "admin_api"

router = DefaultRouter()
router.register("companies", v.CompanyViewSet, basename="admin-company")
router.register("stations", v.StationViewSet, basename="admin-station")
router.register("churches", v.ChurchViewSet, basename="admin-church")
router.register("disbursements", v.DisbursementViewSet, basename="admin-disbursement")
router.register("agents", v.AgentViewSet, basename="admin-agent")
router.register("fuel-types", v.FuelTypeViewSet, basename="admin-fuel-type")

urlpatterns = [
    path("auth/login/", v.AdminLoginView.as_view(), name="login"),

    path("dashboard/stats/", v.dashboard_stats, name="dashboard-stats"),
    path("dashboard/chart/", v.dashboard_chart, name="dashboard-chart"),

    path("transactions/bulk/", v.transaction_bulk_action, name="tx-bulk"),
    path("transactions/export/excel/", v.transaction_export_excel, name="tx-export-excel"),
    path("transactions/export/pdf/", v.transaction_export_pdf, name="tx-export-pdf"),
    path("transactions/<uuid:pk>/", v.transaction_detail, name="tx-detail"),
    path("transactions/", v.transaction_list, name="tx-list"),

    path("verify/<str:receipt_code>/", v.public_verify, name="verify"),

    path("drivers/export/excel/", v.driver_export_excel, name="driver-export-excel"),
    path("drivers/<uuid:pk>/id-card/", v.driver_id_card_api, name="driver-id-card"),
    path("drivers/<uuid:pk>/", v.driver_detail_api, name="driver-detail"),
    path("drivers/", v.driver_list_api, name="driver-list"),

    path("reports/", v.reports_api, name="reports"),
    path("audit/", v.audit_log_api, name="audit"),

    path("", include(router.urls)),
]
