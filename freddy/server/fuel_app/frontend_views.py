"""Views for the standalone Svelte frontend.

The frontend is built into ``static/frontend`` and served as a single shell so
its client-side router can handle nested application URLs.
"""

from pathlib import Path

from django.conf import settings
from django.http import Http404, HttpResponse


FRONTEND_INDEX = Path(settings.BASE_DIR) / "static" / "frontend" / "index.html"


def frontend_index(request):
    """Serve the built frontend shell, or explain how to build it locally."""
    try:
        html = FRONTEND_INDEX.read_text(encoding="utf-8")
    except OSError:
        if settings.DEBUG:
            return HttpResponse(
                "<h1>Frontend not built</h1>"
                "<p>Run <code>cd frontend && bun install && bun run build</code>.</p>",
                status=501,
            )
        raise Http404("Frontend build missing")
    return HttpResponse(html)
