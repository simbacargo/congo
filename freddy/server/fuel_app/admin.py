from django.contrib import admin
from fuel_app.models import (
    Church,
    ExchangeRateCache,
    FuelStation,
    FuelType,
    ParentCompany,
    Transaction,
    TransactionAuditLog,
)


@admin.register(ParentCompany)
class ParentCompanyAdmin(admin.ModelAdmin):
    list_display = ["name", "code", "contact_email", "is_active", "created_at"]
    search_fields = ["name", "code"]
    list_filter = ["is_active"]


@admin.register(FuelStation)
class FuelStationAdmin(admin.ModelAdmin):
    list_display = ["name", "code", "company", "is_active", "created_at"]
    search_fields = ["name", "code"]
    list_filter = ["is_active", "company"]
    autocomplete_fields = ["company"]


@admin.register(Church)
class ChurchAdmin(admin.ModelAdmin):
    list_display = ["name", "station", "contact_person", "contact_phone", "beneficiary_count", "is_active"]
    search_fields = ["name", "contact_person"]
    list_filter = ["is_active", "station__company"]


@admin.register(FuelType)
class FuelTypeAdmin(admin.ModelAdmin):
    list_display = ["name", "code", "is_active"]


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = [
        "receipt_code", "station", "church", "agent",
        "amount_usd", "levy_amount_usd", "status", "created_at",
    ]
    search_fields = ["receipt_code", "church__name", "station__name"]
    list_filter = ["status", "currency_used", "station__company"]
    readonly_fields = [
        "receipt_code", "levy_amount_usd", "levy_amount_cdf",
        "exchange_rate", "created_at", "updated_at",
    ]

    def has_delete_permission(self, request, obj=None):
        return False  # transactions are immutable records


@admin.register(TransactionAuditLog)
class TransactionAuditLogAdmin(admin.ModelAdmin):
    list_display = ["transaction", "field_name", "old_value", "new_value", "changed_by", "changed_at"]
    readonly_fields = ["transaction", "field_name", "old_value", "new_value", "changed_by", "changed_at", "ip_address"]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(ExchangeRateCache)
class ExchangeRateCacheAdmin(admin.ModelAdmin):
    list_display = ["usd_to_cdf", "source", "fetched_at"]
    readonly_fields = ["fetched_at"]
