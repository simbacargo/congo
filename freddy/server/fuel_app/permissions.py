"""DRF permission classes for the role tiers.

These answer "may this user call this endpoint at all"; *which rows* they get
back is decided separately by ``fuel_app.scoping``.

Every class treats a superuser as permitted. That matters more than it looks:
``User.role`` defaults to ``STATION_AGENT`` (authentication/models.py), so an
account made with ``createsuperuser`` carries an agent role and would otherwise
be refused by every admin endpoint. The web-side ``role_required`` decorator has
always bypassed for superusers; this keeps the two consistent.
"""
from rest_framework.permissions import BasePermission

from authentication.models import ROLE_COMPANY_MANAGER, ROLE_NGO_ADMIN, ROLE_STATION_AGENT


class _RolePermission(BasePermission):
    """Base: authenticated, and either a superuser or holding an allowed role."""

    allowed_roles: tuple = ()

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        return bool(user.is_superuser or user.role in self.allowed_roles)


class IsNGOAdmin(_RolePermission):
    allowed_roles = (ROLE_NGO_ADMIN,)


class IsCompanyManager(_RolePermission):
    allowed_roles = (ROLE_COMPANY_MANAGER,)


class IsStationAgent(_RolePermission):
    allowed_roles = (ROLE_STATION_AGENT,)


class IsNGOAdminOrManager(_RolePermission):
    allowed_roles = (ROLE_NGO_ADMIN, ROLE_COMPANY_MANAGER)


class ReadOnlyOrNGOAdmin(BasePermission):
    """Anyone authenticated may read; only NGO admins may write.

    Used by the directory viewsets, where a manager or agent needs to resolve
    names for the rows they can already see but must not edit the records.
    """

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True
        return bool(user.is_superuser or user.role == ROLE_NGO_ADMIN)


class ReadOnlyOrNGOAdminOrManager(BasePermission):
    """Anyone authenticated may read; NGO admins and managers may write."""

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True
        return bool(
            user.is_superuser or user.role in (ROLE_NGO_ADMIN, ROLE_COMPANY_MANAGER)
        )
