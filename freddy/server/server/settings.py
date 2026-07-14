from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


SECRET_KEY = 'django-insecure-#+#t-asn)ni^jo!009l4rs02j*8p1#90e(kev1%y2-$%n8(#8&'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ["kdcharite.com","www.kdcharite.com","localhost","127.0.0.1","192.168.1.191"]

CSRF_TRUSTED_ORIGINS = ["https://kdcharite.com","https://www.kdcharite.com"]

# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    "rest_framework",
    "corsheaders",
    "django_htmx",
    "authentication",
    "knox",
    "fuel_app",
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.locale.LocaleMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django_htmx.middleware.HtmxMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'server.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR/"html"],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'fuel_app.context_processors.nav_stats',
            ],
        },
    },
]

WSGI_APPLICATION = 'server.wsgi.application'


# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}


# Password validation
# https://docs.djangoproject.com/en/6.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/6.0/topics/i18n/

from django.utils.translation import gettext_lazy as _

LANGUAGE_CODE = 'fr'

LANGUAGES = [
    ('en', _('English')),
    ('fr', _('French')),
    ('sw', _('Swahili')),
]

LOCALE_PATHS = [
    BASE_DIR / 'locale',
]

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True

STATIC_URL = '/static/'

STATICFILES_DIRS = [
    BASE_DIR / 'static',
]

# collectstatic output; must not overlap STATICFILES_DIRS
STATIC_ROOT = BASE_DIR / 'staticfiles'

AUTH_USER_MODEL = "authentication.User"

ALLOWED_SIGNUP_DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com']

LOGIN_REDIRECT_URL = '/'
LOGIN_URL = '/login/'
MESSAGE_STORAGE = 'django.contrib.messages.storage.session.SessionStorage'

# CORS (mobile app)
CORS_ALLOW_ALL_ORIGINS = True  # restrict to specific origins in production

# DRF + Knox
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ["knox.auth.TokenAuthentication"],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 25,
}

from datetime import timedelta
REST_KNOX = {
    "TOKEN_TTL": timedelta(hours=24),
    "AUTO_REFRESH": True,
}

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"
