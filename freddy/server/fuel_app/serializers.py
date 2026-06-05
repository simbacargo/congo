from rest_framework import serializers

from fuel_app.models import (
    Church,
    ExchangeRateCache,
    FuelStation,
    FuelType,
    ParentCompany,
    Transaction,
    TransactionAuditLog,
)
from fuel_app.services import get_usd_to_cdf_rate


class ParentCompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = ParentCompany
        fields = ["id", "name", "code", "contact_email", "contact_phone", "is_active"]


class FuelStationSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source="company.name", read_only=True)

    class Meta:
        model = FuelStation
        fields = ["id", "name", "code", "company", "company_name", "address", "is_active"]


class ChurchSerializer(serializers.ModelSerializer):
    station_name = serializers.CharField(source="station.name", read_only=True)
    company_name = serializers.CharField(source="station.company.name", read_only=True)

    class Meta:
        model = Church
        fields = [
            "id", "name", "station", "station_name", "company_name",
            "contact_person", "contact_phone", "beneficiary_count", "is_active",
        ]


class FuelTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = FuelType
        fields = ["id", "name", "code", "is_active"]


class TransactionCreateSerializer(serializers.ModelSerializer):
    """Used by the mobile agent to post a new transaction."""
    sync_id = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Transaction
        fields = [
            "church", "fuel_type", "currency_used",
            "amount_usd", "amount_cdf", "notes", "sync_id", "created_at",
        ]

    def validate_created_at(self, value):
        from django.utils import timezone
        import datetime
        now = timezone.now()
        if value > now + datetime.timedelta(minutes=5):
            raise serializers.ValidationError("created_at cannot be in the future.")
        if value < now - datetime.timedelta(days=7):
            raise serializers.ValidationError("created_at cannot be more than 7 days in the past.")
        return value

    def validate(self, data):
        request = self.context["request"]
        agent = request.user
        # Agents can only post to their assigned station
        if not agent.assigned_station:
            raise serializers.ValidationError("Your account has no assigned station.")
        church = data.get("church")
        if church and church.station != agent.assigned_station:
            raise serializers.ValidationError(
                "Church does not belong to your assigned station."
            )
        return data

    def create(self, validated_data):
        request = self.context["request"]
        agent = request.user
        rate = get_usd_to_cdf_rate()
        tx = Transaction(
            agent=agent,
            station=agent.assigned_station,
            exchange_rate=rate,
            **validated_data,
        )
        tx.save()
        return tx


class TransactionSerializer(serializers.ModelSerializer):
    church_name = serializers.CharField(source="church.name", read_only=True)
    station_name = serializers.CharField(source="station.name", read_only=True)
    company_name = serializers.CharField(source="station.company.name", read_only=True)
    fuel_type_name = serializers.CharField(source="fuel_type.name", read_only=True)
    agent_username = serializers.CharField(source="agent.username", read_only=True)

    class Meta:
        model = Transaction
        fields = [
            "id", "receipt_code", "station", "station_name", "company_name",
            "church", "church_name", "agent", "agent_username",
            "fuel_type", "fuel_type_name", "currency_used",
            "amount_usd", "amount_cdf", "exchange_rate",
            "levy_amount_usd", "levy_amount_cdf",
            "status", "notes", "sync_id", "created_at", "updated_at",
        ]
        read_only_fields = [
            "receipt_code", "levy_amount_usd", "levy_amount_cdf",
            "exchange_rate", "station", "agent",
        ]


class TransactionStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ["status", "notes"]



class TransactionAuditLogSerializer(serializers.ModelSerializer):
    changed_by_username = serializers.CharField(source="changed_by.username", read_only=True)

    class Meta:
        model = TransactionAuditLog
        fields = [
            "id", "field_name", "old_value", "new_value",
            "changed_by", "changed_by_username", "changed_at", "ip_address",
        ]


class ExchangeRateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExchangeRateCache
        fields = ["usd_to_cdf", "source", "fetched_at"]
