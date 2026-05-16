from fuel_app.models import Transaction


def nav_stats(request):
    if not request.user.is_authenticated:
        return {}
    return {
        "stats": {
            "pending_count": Transaction.objects.filter(status=Transaction.Status.PENDING).count()
        }
    }
