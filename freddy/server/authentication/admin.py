from __future__ import unicode_literals

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin 
from .models import *

admin.site.register(Subscription)

class MyUserAdmin(UserAdmin):
	list_display =	('id','username','email')
# 	search_fields =	('username','email')
# 	# readonly_fields =	('username','email')
# 	filter_horizontal=()
# 	list_filter=()
	fieldsets=()
	fields = (
		'firstname',
		'lastname',
		'username',
		'is_active',
		'is_staff',
		'is_admin',
		# 'is_admin',
     )



admin.site.register(User, MyUserAdmin)
