from django.urls import path
from .views import *
app_name ="authentication"
urlpatterns = [
    path('signup', signup),
    path('activate/<uidb64>/<token>', activate, name="activate"),

]