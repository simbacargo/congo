from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _
import random
import os
from django.db.models import Q
from django.db.models.signals import pre_save, post_save
from django.urls import reverse
import uuid
# from activities.models import Notification
from django.contrib.auth.models import PermissionsMixin,BaseUserManager, AbstractBaseUser, Permission, _user_has_perm,AbstractUser
GENDER_TYPES = (
    ('M', 'Male'),
    ('F', 'Female'),
    ('N', 'Non Binary'),
    )

def get_token():
    return str(uuid.uuid4())


def get_filename_ext(filepath):
    base_name = os.path.basename(filepath)
    name, ext = os.path.splitext(base_name)
    return name, ext

def upload_image_path(instance, filename):

    new_filename = random.randint(1,23232335)
    name, ext = get_filename_ext(filename)
    final_filename = '{new_filename}{ext}'.format(new_filename=new_filename, ext=ext)
    return "products/{new_filename}/{final_filename}".format(
            new_filename=new_filename,
            final_filename=final_filename
            )



class UserAccountManager(BaseUserManager):
    use_in_migrations = True
    def get_queryset(self):
        #return super(UserAccountManager,self).get_queryset().filter(is_active=True)
        return super(UserAccountManager,self).get_queryset()

    
    def _create_user(self, username,password,is_staff,is_superuser,**extra_fields):

        # if not email:
        #     raise ValueError('Users must have an email')

        if not password:
            raise ValueError('Users must have an password')

        if not username:
            raise ValueError('The given username must be set')
                # Save the user

        # email = self.normalize_email(email)
        username = self.model.normalize_username(username)

        user_obj = self.model(username=username,is_active = True,is_superuser = is_superuser,**extra_fields )
        user_obj.set_password(password)
        user_obj.save(using = self._db)
        return user_obj

    def create_user(self, username, password,**extra_fields):
        return self._create_user(username,password,False,False,**extra_fields)



    def create_superuser(self, username, password,**extra_fields):
        return self._create_user(username,password,True,True,**extra_fields)
    def get_by_natural_key(self, username):
        return self.get(username=username)


from django.utils.translation import gettext_lazy as _
class User(AbstractBaseUser,PermissionsMixin):
    id = models.UUIDField(default=get_token, editable=False, unique=True,primary_key=True)
    firstname = models.CharField(max_length=100, null=True, blank=True)
    lastname = models.CharField(max_length=100, null=True, blank=True)
    username = models.CharField(max_length=100, null=False, unique=True)
    email = models.EmailField(max_length=255,unique=True,blank=True,null=True)
    gender = models.CharField(choices=GENDER_TYPES, max_length=10)
    is_active = models.BooleanField(default=False)#designates if accounts can be used to log in
    is_staff = models.BooleanField(default=True)#is user allowed to add and manage data
    is_admin = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    hide_email = models.BooleanField(default=False)
    last_seen = models.DateTimeField(auto_now=True)
    password=models.CharField(blank=True,max_length=256)
    date_of_birth = models.DateField(default='2000-01-01', null=True)
    country = models.CharField(max_length=50, null=True)
    district = models.CharField(max_length=50, null=True)#Pronvice
    city = models.CharField(max_length=50, null=True)
    language = models.CharField(max_length=150, null=True)
    mobile = models.CharField(max_length=26, default='0', null=True)
    date_joined = models.DateTimeField(auto_now_add=True)
    pincode = models.CharField(default='', max_length=10, null=True)
    current_location = models.CharField(default='', max_length=100, null=True)
    current_ip = models.CharField(default='', max_length=100, null=True)
    last_known_device = models.CharField(default='', max_length=100, null=True)
    facebook_account = models.URLField(_("Facebook profile"), max_length=255, blank=True, null=True)
    USERNAME_FIELD = 'username'
    objects = UserAccountManager()

    REQUIRED_FIELDS = []
    def get_absolute_url(self):
        return "/authenticaton/{slug}/".format(slug=self.id)

    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('Users')

    def __unicode__(self):
        return self.username
    def __str__(self):
        return str(self.username)

    def get_full_name(self):
        """
        Returns the given_name plus the family_name, with a space in between.
        """
        full_name = '%s %s' % (self.given_name, self.family_name)
        return full_name.strip()


    def get_username(self):
        return self.username

    def email_user(self, subject, message, from_email=None, **kwargs):
        send_mail(subject, message, from_email, [self.email], **kwargs)

    def has_perm(self, perm, obj=None):
        """
        Returns True if the user has the specified permission. This method
        queries all available auth backends, but returns immediately if any
        backend returns True. Thus, a user who has permission from a single
        auth backend is assumed to have permission in general. If an object is
        provided, permissions for this specific object are checked.
        """

        # Active superusers have all permissions.
        if self.is_active and self.is_superuser:
            return True

        # Otherwise we need to check the backends.
        return _user_has_perm(self, perm, obj)
    

    def has_module_perm(self, perm, obj=None):
        """
        To be modified during revision 1"""

        # Active superusers have all permissions.
        if self.is_active and self.is_superuser:
            return True

        # Otherwise we need to check the backends.
        return _user_has_perm(self, perm, obj)
    

    def get_profile_picture(self, perm, obj=None):
        return str(self.profile_picture)[srt(self.profile_picture).index(f'profile_picture/{self.pk}/'): ]


from django.utils import timezone
from datetime import timedelta

class Subscription(models.Model):
    SUBSCRIPTION_TIERS = (
        ('B', 'Basic'),
        ('P', 'Pro'),
        ('U', 'Premium'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='subscription')
    tier = models.CharField(max_length=1, choices=SUBSCRIPTION_TIERS, default='B')
    active = models.BooleanField(default=True)
    start_date = models.DateTimeField(auto_now_add=True)
    expiry_date = models.DateTimeField()
    notified_expiry = models.BooleanField(default=False) # To prevent duplicate alerts

    def save(self, *args, **kwargs):
        # Automatically set expiry to 30 days if not set
        if not self.expiry_date:
            self.expiry_date = timezone.now() + timedelta(days=30)
        super().save(*args, **kwargs)

    @property
    def days_left(self):
        remainder = self.expiry_date - timezone.now()
        return remainder.days

    def __str__(self):
        return f"{self.user.username} - {self.get_tier_display()}"

# def create_user_subscription(sender, instance, created, **kwargs):
#     if created:
#         Subscription.objects.create(user=instance)
#         from home.models import Business
#         business = Business.objects.create(owner=instance, name=f"{instance.username}'s Business")
#         business.members.add(instance)

# post_save.connect(create_user_subscription, sender=User)


class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    message = models.CharField(max_length=255)
    read = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.user.username}: {self.message[:20]}..."
    
    def mark_as_read(self):
        self.read = True
        self.save()
        
        
        
        