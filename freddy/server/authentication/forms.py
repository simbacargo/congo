from django import forms
from django.core.exceptions import ValidationError

from server.settings import ALLOWED_SIGNUP_DOMAINS
from django.contrib.auth import (
    authenticate, get_user_model, password_validation,
)
User = get_user_model()


def SignupDomainValidator(value):
    if '*' not in ALLOWED_SIGNUP_DOMAINS:
        try:
            domain = value[value.index("@"):]
            if domain not in ALLOWED_SIGNUP_DOMAINS:
                raise ValidationError('Invalid domain. Allowed domains on this network: {0}'.format(','.join(ALLOWED_SIGNUP_DOMAINS)))  # noqa: E501

        except Exception:
            raise ValidationError('Invalid domain. Allowed domains on this network: {0}'.format(','.join(ALLOWED_SIGNUP_DOMAINS)))  # noqa: E501


def ForbiddenUsernamesValidator(value):
    forbidden_usernames = [
        'admin', 'settings', 'news', 'about', 'help', 'signin', 'signup', 'signout', 'terms', 'privacy', 'cookie',
        'new', 'login', 'logout', 'administrator', 'join', 'account', 'username', 'root', 'blog', 'user', 'users', 
        'billing', 'subscribe', 'reviews', 'review', 'blog', 'blogs', 'edit', 'mail', 'email', 'home', 'job', 'jobs', 
        'contribute', 'newsletter', 'shop', 'profile', 'register', 'auth', 'authentication', 'campaign', 'config', 'delete', 
        'remove', 'forum', 'forums', 'download', 'downloads', 'contact', 'blogs', 'feed', 'feeds', 'faq', 'intranet', 'log', 
        'registration', 'search', 'explore', 'rss', 'support', 'status', 'static', 'media', 'setting', 'css', 'js', 'follow', 
        'activity', 'questions', 'articles', 'network','celebtiry','pornstar' ]

    if value.lower() in forbidden_usernames:
        raise ValidationError('This is a reserved word.')


def InvalidUsernameValidator(value):
    if '@' in value or '+' in value or '-' in value:
        raise ValidationError('Enter a valid username.')


def UniqueEmailValidator(value):
    if User.objects.filter(email__iexact=value).exists():
        raise ValidationError('User with this Email already exists.')


def UniqueUsernameIgnoreCaseValidator(value):
    if User.objects.filter(username__iexact=value).exists():
        raise ValidationError('User with this Username already exists.')


from django import forms
from django.contrib.auth.forms import UserCreationForm
CHOICES=GENDER_TYPES = (
    ('M', 'Male'),
    ('F', 'Female'),
    ('N', 'Non Binary'),
    )

class SignupForm(UserCreationForm):
    firstname = forms.CharField(
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'First Name'})
    )
    lastname = forms.CharField(
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Last Name'})
    )
    username = forms.CharField(
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Username'})
    )
    email = forms.EmailField(
        widget=forms.EmailInput(attrs={'class': 'form-control', 'placeholder': 'Email'})
    )
    password1 = forms.CharField(
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': 'Password'})
    )
    password2 = forms.CharField(
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': 'Retype Password'})
    )
    # date_of_birth = forms.DateField(
        # widget=forms.DateInput(attrs={'class': 'form-control', 'type': 'date'})
    # )

    class Meta:
        model = User
        fields = ('firstname', 'lastname', 'username', 'email', 'password1', 'password2')

    def __init__(self, *args, **kwargs):
        super(SignupForm, self).__init__(*args, **kwargs)
        self.fields['username'].validators.append(ForbiddenUsernamesValidator)
        self.fields['username'].validators.append(InvalidUsernameValidator)
        self.fields['username'].validators.append(UniqueUsernameIgnoreCaseValidator)
        self.fields['email'].validators.append(UniqueEmailValidator)
        self.fields['email'].validators.append(SignupDomainValidator)
        
        # Add Bootstrap form-group class to fields for better layout control
        for field in self.fields.values():
            field.widget.attrs.update({'class': 'form-control'})

    def clean(self):
        cleaned_data = super(SignupForm, self).clean()
        password = cleaned_data.get('password1')
        confirm_password = cleaned_data.get('password2')
        if password and password != confirm_password:
            self.add_error('password2', 'Passwords don\'t match')
        return cleaned_data