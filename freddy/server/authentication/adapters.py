# authentication/adapters.py

from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.contrib.auth import get_user_model
from allauth.socialaccount.models import SocialLogin

# authentication/adapters.py

from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.contrib.auth import get_user_model
from allauth.socialaccount.models import SocialAccount
# Import IntegrityError, which we will use to force the flow to stop
from django.db import IntegrityError 

class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):

    def pre_social_login(self, request, sociallogin):
        User = get_user_model()
        email = sociallogin.account.extra_data.get('email')

        if email:
            try:
                # 1. Look up the local user by email (case-insensitive)
                user = User.objects.get(email__iexact=email)

                # 2. Check if the user already has this specific social account linked.
                # If they do, the flow will proceed to login normally.
                if SocialAccount.objects.filter(user=user, provider=sociallogin.account.provider).exists():
                    return
                
                # 3. If no social account is linked, link it now.
                sociallogin.connect(request, user)
                
                # 4. Critical step: Raise a benign exception.
                # This stops the 'allauth' flow from proceeding to the user creation steps 
                # (which cause the UNIQUE constraint error) but allows the login process 
                # to complete with the now-connected account.
                raise IntegrityError() 
                
            except User.DoesNotExist:
                # No existing user, allow the flow to continue to save_user for creation
                pass
            except IntegrityError:
                # We catch the exception we intentionally raised and allow the rest 
                # of the allauth login process (which is now a login, not a signup) to execute.
                pass
    
        
            # Keep your custom save_user method for when a *new* user truly needs to be created
    def save_user(self, request, sociallogin, form=None):
        # ... (Your existing save_user logic remains here)
        user = sociallogin.user
        extra_data = sociallogin.account.extra_data

        user.firstname = extra_data.get('given_name', '')
        user.lastname = extra_data.get('family_name', '')
        user.is_active = True 

        # Handle the required unique 'username' field
        if not user.username:
            base_username = extra_data.get('name', user.email.split('@')[0])
            username_part = base_username.replace(' ', '.').lower()

            User = get_user_model()
            username = username_part
            i = 0
            while User.objects.filter(username=username).exists():
                i += 1
                username = f"{username_part}{i}"

            user.username = username

        user.save()
        return user