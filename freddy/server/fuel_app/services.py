"""Currency and audit utilities for the fuel initiative."""
from decimal import Decimal
from datetime import timedelta

import requests
from django.utils import timezone


RATE_CACHE_MINUTES = 30
FALLBACK_RATE = Decimal("2800.00")  # conservative fallback when API is unreachable


def get_usd_to_cdf_rate() -> Decimal:
    """
    Returns current USD→CDF rate.
    Checks DB cache first; fetches from open.er-api.com if stale.
    Falls back to last known rate or FALLBACK_RATE on failure.
    """
    from fuel_app.models import ExchangeRateCache

    cutoff = timezone.now() - timedelta(minutes=RATE_CACHE_MINUTES)
    cached = ExchangeRateCache.objects.filter(fetched_at__gte=cutoff).first()
    if cached:
        return cached.usd_to_cdf

    try:
        resp = requests.get(
            "https://open.er-api.com/v6/latest/USD",
            timeout=5,
        )
        resp.raise_for_status()
        data = resp.json()
        rate = Decimal(str(data["rates"]["CDF"]))
        ExchangeRateCache.objects.create(usd_to_cdf=rate, source="open.er-api.com")
        return rate
    except Exception:
        last = ExchangeRateCache.objects.order_by("-fetched_at").first()
        return last.usd_to_cdf if last else FALLBACK_RATE


def record_audit_log(transaction, user, field_name, old_value, new_value, request=None):
    """Write an immutable audit entry for a transaction field change."""
    from fuel_app.models import TransactionAuditLog

    ip = None
    if request:
        x_forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
        ip = x_forwarded.split(",")[0].strip() if x_forwarded else request.META.get("REMOTE_ADDR")

    TransactionAuditLog.objects.create(
        transaction=transaction,
        changed_by=user,
        field_name=field_name,
        old_value=str(old_value) if old_value is not None else None,
        new_value=str(new_value) if new_value is not None else None,
        ip_address=ip,
    )
