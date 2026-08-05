from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.contrib.auth.views import LogoutView, LoginView
from django.urls import include, path, re_path
from django.views.i18n import set_language

from fuel_app.views import api_login, spa_index
from fuel_app.frontend_views import frontend_index

urlpatterns = [
    path("admin/", admin.site.urls),
    path("i18n/set_language/", set_language, name="set_language"),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(next_page="/login/"), name="logout"),
    path("accounts/", include("django.contrib.auth.urls")),
    # JSON login for the mobile app; must precede knox.urls so it overrides
    # knox's token-only LoginView at the same path.
    path("api/auth/login/", api_login, name="api-login"),
    path("api/auth/", include("knox.urls")),
    path("api/admin/", include("fuel_app.admin_urls")),
    # The standalone Svelte frontend. Keep this separate from the existing
    # React SPA under /app/.
    re_path(r"^frontend(?:/.*)?$", frontend_index, name="frontend"),
    # The React SPA. Everything under /app/ is client-routed, so one shell
    # serves them all. Declared above the fuel_app catch-all; /api/, /admin/,
    # /static/ and /media/ are all matched earlier and are unaffected.
    re_path(r"^app/", spa_index, name="spa"),
    path("", include("fuel_app.urls", namespace="fuel")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) \
  + staticfiles_urlpatterns()
