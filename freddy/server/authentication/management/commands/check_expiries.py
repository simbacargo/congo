from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from your_app.models import Subscription

class Command(BaseCommand):
    help = 'Check for subscriptions expiring in 10 days'

    def handle(self, *args, **options):
        # Target date is 10 days from now
        target_date = timezone.now().date() + timedelta(days=10)
        
        # Find active subs expiring on that date that haven't been notified
        expiring_soon = Subscription.objects.filter(
            expiry_date__date=target_date,
            active=True,
            notified_expiry=False
        )

        for sub in expiring_soon:
            # Here you'd call your email or notification function
            sub.user.email_user(
                subject="Subscription Expiry Warning",
                message=f"Hi {sub.user.firstname}, your {sub.get_tier_display()} plan expires in 10 days!"
            )
            sub.notified_expiry = True
            sub.save()
            
        self.stdout.write(f"Processed {expiring_soon.count()} notifications.")
