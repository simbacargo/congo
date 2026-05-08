
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from authentication.views import LoginView
from django.contrib.auth.views import LogoutView, LoginView

from home.views import *  
urlpatterns = [
    path('admin/', admin.site.urls),

    path(r'login/', LoginView.as_view(), name='login'),

     path('logout', LogoutView.as_view(), {'next_page': "/"}, name='logout'),

    path('accounts/', include('django.contrib.auth.urls')),

    
    path('',home, name='home'),
    path('profile', profile),
    path('sales', sales),
    path('sales/create', sales_create),
    path('sales/update', sales_update),
    path('sales/1/edit', sales_edit),
    
    
    path('reports', reports),
    path('reports/create', reports_create),
    path('reports/update', reports_update),
    
    
    path('expenses', expenses),
    path('new_expense',new_expense),
    path('new_expense',new_expense),
    path('Users',users),
    path('Staff',staff),
    path('Reports',reports),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
