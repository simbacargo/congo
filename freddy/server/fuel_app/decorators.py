from functools import wraps

from django.contrib.auth.decorators import login_required
from django.core.exceptions import PermissionDenied


def role_required(*roles):
    """Restrict a web view to users whose ``role`` is in ``roles``.

    Superusers always pass. Anonymous users are sent to the login page;
    authenticated users with the wrong role get a 403.
    """
    def decorator(view):
        @wraps(view)
        @login_required
        def wrapped(request, *args, **kwargs):
            user = request.user
            if not (user.is_superuser or user.role in roles):
                raise PermissionDenied
            return view(request, *args, **kwargs)
        return wrapped
    return decorator
