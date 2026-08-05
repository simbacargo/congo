"""Row-level scoping — what each role is allowed to *see*.

Every queryset the API hands back should pass through one of these. The rules
mirror the three roles in ``authentication.models``:

* **NGO admins and superusers** see everything.
* **Company managers** see their own company's stations and everything hanging
  off them (churches, transactions, disbursements, agents).
* **Station agents** see only their assigned station.

The consistent rule for an *unassigned* user — a manager with no
``managed_company``, an agent with no ``assigned_station`` — is that they see
**nothing** rather than everything. Defaulting to ``.none()`` means a
half-configured account leaks no data; defaulting the other way would hand a
fresh account the whole database.

``Driver`` is deliberately absent: the OSS registration dataset is a shared
NGO-wide resource, not owned by any station, so it is never scoped.
"""
from authentication.models import (
    ROLE_COMPANY_MANAGER,
    ROLE_NGO_ADMIN,
    ROLE_STATION_AGENT,
)


def _unrestricted(user) -> bool:
    """True for the roles that see everything.

    Superusers are included explicitly. ``User.role`` defaults to
    ``STATION_AGENT`` (authentication/models.py), so a plain
    ``createsuperuser`` account carries an agent role and would otherwise be
    scoped down to a station it does not have.
    """
    return bool(user.is_superuser or user.role == ROLE_NGO_ADMIN)


def scope_transactions(user, qs):
    """Restrict a ``Transaction`` queryset to what ``user`` may see."""
    if not user or not user.is_authenticated:
        return qs.none()
    if _unrestricted(user):
        return qs
    if user.role == ROLE_STATION_AGENT:
        return qs.filter(station=user.assigned_station) if user.assigned_station_id else qs.none()
    if user.role == ROLE_COMPANY_MANAGER:
        return qs.filter(station__company=user.managed_company) if user.managed_company_id else qs.none()
    return qs.none()


def scope_stations(user, qs):
    """Restrict a ``FuelStation`` queryset."""
    if not user or not user.is_authenticated:
        return qs.none()
    if _unrestricted(user):
        return qs
    if user.role == ROLE_STATION_AGENT:
        return qs.filter(pk=user.assigned_station_id) if user.assigned_station_id else qs.none()
    if user.role == ROLE_COMPANY_MANAGER:
        return qs.filter(company=user.managed_company) if user.managed_company_id else qs.none()
    return qs.none()


def scope_companies(user, qs):
    """Restrict a ``ParentCompany`` queryset."""
    if not user or not user.is_authenticated:
        return qs.none()
    if _unrestricted(user):
        return qs
    if user.role == ROLE_STATION_AGENT:
        # Reverse FK by pk, so the agent's station is never loaded.
        return qs.filter(stations=user.assigned_station_id) if user.assigned_station_id else qs.none()
    if user.role == ROLE_COMPANY_MANAGER:
        return qs.filter(pk=user.managed_company_id) if user.managed_company_id else qs.none()
    return qs.none()


def scope_churches(user, qs):
    """Restrict a ``Church`` queryset."""
    if not user or not user.is_authenticated:
        return qs.none()
    if _unrestricted(user):
        return qs
    if user.role == ROLE_STATION_AGENT:
        return qs.filter(station=user.assigned_station) if user.assigned_station_id else qs.none()
    if user.role == ROLE_COMPANY_MANAGER:
        return qs.filter(station__company=user.managed_company) if user.managed_company_id else qs.none()
    return qs.none()


def scope_disbursements(user, qs):
    """Restrict a ``Disbursement`` queryset.

    Agents get nothing — disbursement to churches is an NGO-level concern that
    station staff have no part in.
    """
    if not user or not user.is_authenticated:
        return qs.none()
    if _unrestricted(user):
        return qs
    if user.role == ROLE_COMPANY_MANAGER and user.managed_company_id:
        return qs.filter(church__station__company=user.managed_company)
    return qs.none()


def scope_users(user, qs):
    """Restrict a ``User`` queryset.

    Everyone can always see themselves, which is what makes the "My history"
    page work for every role without a special case.
    """
    from django.db.models import Q

    if not user or not user.is_authenticated:
        return qs.none()
    if _unrestricted(user):
        return qs
    if user.role == ROLE_COMPANY_MANAGER and user.managed_company_id:
        return qs.filter(
            Q(assigned_station__company=user.managed_company) | Q(pk=user.pk)
        )
    return qs.filter(pk=user.pk)


def scope_audit_logs(user, qs):
    """Restrict a ``TransactionAuditLog`` queryset.

    Agents get nothing: the audit trail records who changed a transaction's
    status after the fact, which is a supervisory view, not a field one.
    """
    if not user or not user.is_authenticated:
        return qs.none()
    if _unrestricted(user):
        return qs
    if user.role == ROLE_COMPANY_MANAGER and user.managed_company_id:
        return qs.filter(transaction__station__company=user.managed_company)
    return qs.none()


# ─── Capability map ───────────────────────────────────────────────────────────

def permission_map(user):
    """What ``user`` may *do*, as a flat dict of booleans.

    Served from ``/api/admin/me/`` so the SPA builds its nav and hides its
    write actions from one authoritative source, instead of re-deriving role
    logic in the client the way ``html/base.html`` does today. These mirror the
    ``@role_required`` decorators on the web views one-for-one.
    """
    is_admin = bool(user.is_superuser or user.role == ROLE_NGO_ADMIN)
    is_manager = user.role == ROLE_COMPANY_MANAGER
    return {
        "view_dashboard": True,
        "view_transactions": True,
        "view_drivers": True,
        "view_own_history": True,
        # Admin + manager
        "manage_stations": is_admin or is_manager,
        "manage_churches": is_admin or is_manager,
        "view_reports": is_admin or is_manager,
        # Admin only
        "manage_companies": is_admin,
        "manage_agents": is_admin,
        "manage_disbursements": is_admin,
        "manage_fuel_types": is_admin,
        "view_audit": is_admin,
        "update_transaction_status": is_admin,
        "bulk_update_transactions": is_admin,
    }
