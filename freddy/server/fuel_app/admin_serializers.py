"""Serializers for the Next.js v2 admin dashboard (`/api/admin/...`).

These are additive — the mobile-facing serializers in `fuel_app/serializers.py`
are untouched and reused here where they already fit.
"""
from rest_framework import serializers

from authentication.models import User
from fuel_app.models import Church, Disbursement, Driver, FuelStation, ParentCompany


class ParentCompanyAdminSerializer(serializers.ModelSerializer):
    logo = serializers.ImageField(required=False, allow_null=True)
    station_count = serializers.IntegerField(read_only=True, required=False)
    tx_count = serializers.IntegerField(read_only=True, required=False)
    total_levy = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True, required=False)

    class Meta:
        model = ParentCompany
        fields = [
            "id", "name", "code", "logo", "contact_email", "contact_phone",
            "is_active", "created_at", "station_count", "tx_count", "total_levy",
        ]


class FuelStationAdminSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source="company.name", read_only=True)
    church_count = serializers.IntegerField(read_only=True, required=False)
    tx_count = serializers.IntegerField(read_only=True, required=False)
    total_levy = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True, required=False)

    class Meta:
        model = FuelStation
        fields = [
            "id", "name", "code", "company", "company_name", "address",
            "latitude", "longitude", "is_active", "created_at",
            "church_count", "tx_count", "total_levy",
        ]


class ChurchAdminSerializer(serializers.ModelSerializer):
    station_name = serializers.CharField(source="station.name", read_only=True)
    company_name = serializers.CharField(source="station.company.name", read_only=True)
    tx_count = serializers.IntegerField(read_only=True, required=False)
    total_levy = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True, required=False)
    disburse_count = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = Church
        fields = [
            "id", "name", "station", "station_name", "company_name",
            "contact_person", "contact_phone", "beneficiary_count", "is_active",
            "created_at", "tx_count", "total_levy", "disburse_count",
        ]


class DisbursementSerializer(serializers.ModelSerializer):
    church_name = serializers.CharField(source="church.name", read_only=True)
    prepared_by_username = serializers.CharField(source="prepared_by.username", read_only=True, default=None)

    class Meta:
        model = Disbursement
        fields = [
            "id", "reference", "church", "church_name", "period_start", "period_end",
            "amount_usd", "amount_cdf", "status", "paid_at", "payment_method", "notes",
            "prepared_by_username", "created_at", "updated_at",
        ]
        read_only_fields = ["reference", "paid_at"]

    def update(self, instance, validated_data):
        from django.utils import timezone

        new_status = validated_data.get("status", instance.status)
        instance = super().update(instance, validated_data)
        if new_status == Disbursement.Status.PAID and not instance.paid_at:
            instance.paid_at = timezone.now()
            instance.save(update_fields=["paid_at"])
        return instance


class DriverListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Driver
        fields = [
            "id", "full_name", "phone", "email", "gender", "marital_status",
            "commune", "quartier", "vehicle_type", "fuel_type",
            "daily_fuel_consumption", "has_health_coverage", "field_agent",
            "registration_date",
        ]


class DriverDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Driver
        fields = [
            "id", "full_name", "gender", "phone", "email", "marital_status",
            "commune", "quartier", "city_country", "vehicle_type", "vehicle_color",
            "daily_fuel_consumption", "fuel_type", "has_health_coverage",
            "has_care_access_difficulty", "dependents", "field_agent", "consent",
            "registration_date", "submitted_at", "score", "created_at",
        ]


class UserAdminSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    assigned_station_name = serializers.CharField(source="assigned_station.name", read_only=True, default=None)
    managed_company_name = serializers.CharField(source="managed_company.name", read_only=True, default=None)

    class Meta:
        model = User
        fields = [
            "id", "username", "firstname", "lastname", "email", "mobile", "role",
            "assigned_station", "assigned_station_name", "managed_company",
            "managed_company_name", "is_active", "date_joined", "last_seen", "password",
        ]
        read_only_fields = ["date_joined", "last_seen"]

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_password(User.objects.make_random_password())
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        instance = super().update(instance, validated_data)
        if password:
            instance.set_password(password)
            instance.save(update_fields=["password"])
        return instance
