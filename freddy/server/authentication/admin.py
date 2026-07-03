from __future__ import unicode_literals

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin 
from .models import *

admin.site.register(Subscription)

class MyUserAdmin(UserAdmin):
	list_display =	('id','username','email','role','assigned_station')
# 	search_fields =	('username','email')
# 	# readonly_fields =	('username','email')
# 	filter_horizontal=()
	list_filter=('role','assigned_station')
	fieldsets=()
	fields = (
		'firstname',
		'lastname',
		'username',
		'email',
		'password',
		'is_active',
		'is_staff',
		'is_admin',
        'role',
		'assigned_station',
		'managed_company',
     )



admin.site.register(User, MyUserAdmin)
