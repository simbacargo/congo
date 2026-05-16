from rest_framework.permissions import BasePermission
from authentication.models import ROLE_NGO_ADMIN, ROLE_COMPANY_MANAGER, ROLE_STATION_AGENT


class IsNGOAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == ROLE_NGO_ADMIN)


class IsCompanyManager(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == ROLE_COMPANY_MANAGER)


class IsStationAgent(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == ROLE_STATION_AGENT)


class IsNGOAdminOrManager(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and request.user.role in (ROLE_NGO_ADMIN, ROLE_COMPANY_MANAGER)
        )
