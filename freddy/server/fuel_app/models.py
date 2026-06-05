import hashlib
import secrets
import uuid
from decimal import Decimal

from django.conf import settings
from django.db import models
from django.utils import timezone


FUEL_LEVY_RATE = Decimal("0.02")


def generate_receipt_code():
    raw = secrets.token_hex(8).upper()
    checksum = hashlib.sha256(raw.encode()).hexdigest()[:4].upper()
    return f"LCI-{raw[:4]}-{raw[4:]}-{checksum}"


class ParentCompany(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=20, unique=True)
    logo = models.ImageField(upload_to="companies/", null=True, blank=True)
    contact_email = models.EmailField(null=True, blank=True)
    contact_phone = models.CharField(max_length=30, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Parent Companies"
        ordering = ["name"]

    def __str__(self):
        return self.name


class FuelStation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=30, unique=True)
    company = models.ForeignKey(
        ParentCompany, on_delete=models.PROTECT, related_name="stations"
    )
    address = models.TextField(null=True, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["company__name", "name"]

    def __str__(self):
        return f"{self.name} ({self.company.code})"


class Church(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    station = models.ForeignKey(
        FuelStation, on_delete=models.PROTECT, related_name="churches"
    )
    contact_person = models.CharField(max_length=150, null=True, blank=True)
    contact_phone = models.CharField(max_length=30, null=True, blank=True)
    beneficiary_count = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} → {self.station.name}"


class FuelType(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class Transaction(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        VERIFIED = "VERIFIED", "Verified"
        REMITTED = "REMITTED", "Remitted to NGO"

    class Currency(models.TextChoices):
        USD = "USD", "US Dollar"
        CDF = "CDF", "Congolese Franc"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    receipt_code = models.CharField(max_length=30, unique=True, editable=False)

    station = models.ForeignKey(
        FuelStation, on_delete=models.PROTECT, related_name="transactions"
    )
    church = models.ForeignKey(
        Church, on_delete=models.PROTECT, related_name="transactions"
    )
    agent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="transactions",
    )
    fuel_type = models.ForeignKey(
        FuelType, on_delete=models.PROTECT, related_name="transactions"
    )

    currency_used = models.CharField(
        max_length=3, choices=Currency.choices, default=Currency.USD
    )
    amount_usd = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    amount_cdf = models.DecimalField(max_digits=16, decimal_places=2, default=0)
    exchange_rate = models.DecimalField(
        max_digits=12, decimal_places=4, default=0,
        help_text="USD/CDF rate at time of transaction"
    )
    levy_amount_usd = models.DecimalField(max_digits=12, decimal_places=4, default=0)
    levy_amount_cdf = models.DecimalField(max_digits=16, decimal_places=4, default=0)

    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.PENDING
    )
    notes = models.TextField(null=True, blank=True)

    # Offline sync support
    sync_id = models.CharField(max_length=64, unique=True, null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if not self.receipt_code:
            self.receipt_code = generate_receipt_code()
        if self.currency_used == self.Currency.USD and self.amount_usd:
            self.levy_amount_usd = (self.amount_usd * FUEL_LEVY_RATE).quantize(Decimal("0.0001"))
            if self.exchange_rate:
                self.amount_cdf = (self.amount_usd * self.exchange_rate).quantize(Decimal("0.01"))
                self.levy_amount_cdf = (self.amount_cdf * FUEL_LEVY_RATE).quantize(Decimal("0.0001"))
        elif self.currency_used == self.Currency.CDF and self.amount_cdf:
            self.levy_amount_cdf = (self.amount_cdf * FUEL_LEVY_RATE).quantize(Decimal("0.0001"))
            if self.exchange_rate:
                self.amount_usd = (self.amount_cdf / self.exchange_rate).quantize(Decimal("0.01"))
                self.levy_amount_usd = (self.amount_usd * FUEL_LEVY_RATE).quantize(Decimal("0.0001"))
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.receipt_code} — {self.station} ({self.status})"


class TransactionAuditLog(models.Model):
    """Immutable audit trail for transaction field changes (fraud prevention)."""
    transaction = models.ForeignKey(
        Transaction, on_delete=models.CASCADE, related_name="audit_logs"
    )
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="audit_entries",
    )
    field_name = models.CharField(max_length=100)
    old_value = models.TextField(null=True, blank=True)
    new_value = models.TextField(null=True, blank=True)
    changed_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering = ["-changed_at"]

    def __str__(self):
        return f"{self.transaction.receipt_code}.{self.field_name} @ {self.changed_at:%Y-%m-%d %H:%M}"


class ExchangeRateCache(models.Model):
    """Stores fetched exchange rates to avoid repeated external API calls."""
    usd_to_cdf = models.DecimalField(max_digits=12, decimal_places=4)
    source = models.CharField(max_length=100, default="open.er-api.com")
    fetched_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-fetched_at"]
        get_latest_by = "fetched_at"

    def __str__(self):
        return f"1 USD = {self.usd_to_cdf} CDF ({self.fetched_at:%Y-%m-%d %H:%M})"


class Disbursement(models.Model):
    """Records a levy payout from the NGO to a church."""

    class Status(models.TextChoices):
        SCHEDULED = "SCHEDULED", "Scheduled"
        PAID = "PAID", "Paid"
        CANCELLED = "CANCELLED", "Cancelled"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reference = models.CharField(max_length=40, unique=True, editable=False)
    church = models.ForeignKey(Church, on_delete=models.PROTECT, related_name="disbursements")
    period_start = models.DateField()
    period_end = models.DateField()
    amount_usd = models.DecimalField(max_digits=12, decimal_places=2)
    amount_cdf = models.DecimalField(max_digits=16, decimal_places=2, default=0)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.SCHEDULED)
    paid_at = models.DateTimeField(null=True, blank=True)
    payment_method = models.CharField(max_length=100, null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    prepared_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="disbursements_prepared"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if not self.reference:
            raw = secrets.token_hex(4).upper()
            self.reference = f"DSB-{self.church_id}-{raw}" if self.church_id else f"DSB-{raw}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.reference} → {self.church} (${self.amount_usd})"


class Driver(models.Model):
    """A registered moto-taxi / vehicle driver for the OSS health program.

    Imported from the Google Forms "Base de données chauffeurs" export.
    Free-text categorical values (gender, vehicle type, etc.) are stored as
    received to avoid losing data to dropdown typos; range fields such as daily
    fuel consumption and dependents are kept as text because the source records
    them as ranges (e.g. "5 à 10") rather than exact numbers.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Google Form submission timestamp (Horodateur). Effectively a unique
    # submission id, used as the idempotency key on (re-)import.
    submitted_at = models.DateTimeField(
        unique=True, null=True, blank=True,
        help_text="Form submission timestamp (Horodateur)",
    )
    score = models.IntegerField(default=0)

    # Identity
    full_name = models.CharField(max_length=200, null=True, blank=True)
    gender = models.CharField(max_length=20, null=True, blank=True)
    phone = models.CharField(max_length=30, db_index=True, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    marital_status = models.CharField(max_length=30, null=True, blank=True)

    # Location
    commune = models.CharField(max_length=100, null=True, blank=True)
    quartier = models.CharField(max_length=100, null=True, blank=True)
    city_country = models.CharField(max_length=120, null=True, blank=True)

    # Vehicle
    vehicle_type = models.CharField(max_length=60, null=True, blank=True)
    vehicle_color = models.CharField(max_length=40, null=True, blank=True)
    daily_fuel_consumption = models.CharField(
        max_length=30, null=True, blank=True, help_text="Litres per day (range)"
    )
    fuel_type = models.CharField(max_length=30, null=True, blank=True)

    # OSS health program
    has_health_coverage = models.BooleanField(null=True, blank=True)
    has_care_access_difficulty = models.BooleanField(null=True, blank=True)
    dependents = models.CharField(
        max_length=20, null=True, blank=True, help_text="Number of dependents (range)"
    )

    field_agent = models.CharField(max_length=120, null=True, blank=True)
    consent = models.BooleanField(default=False)
    registration_date = models.DateField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-submitted_at"]

    def __str__(self):
        return f"{self.full_name or 'Unknown'} ({self.phone or 'no phone'})"


class StationTarget(models.Model):
    """Monthly levy collection target per station, for progress tracking."""
    station = models.ForeignKey(FuelStation, on_delete=models.CASCADE, related_name="targets")
    year = models.PositiveSmallIntegerField()
    month = models.PositiveSmallIntegerField()
    target_usd = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        unique_together = ("station", "year", "month")
        ordering = ["-year", "-month"]

    def __str__(self):
        return f"{self.station} — {self.year}/{self.month:02d}: ${self.target_usd}"
