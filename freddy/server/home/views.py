from django.contrib.auth.decorators import login_required
from django.shortcuts import render

# Create your views here.
@login_required
def home(request):
    return render(request, 'home.html')


def profile(request):
    return render(request, 'profile.html')

def expenses(request):
    return render(request, 'expenses.html')

def new_expense(request):
    return render(request, 'new_expenses.html')


def sales(request):
    return render(request, 'purchases/index.html')

def sales_create(request):
    return render(request, 'purchases/create.html')

def sales_update(request):
    return render(request, 'purchases/update.html')

def sales_edit(request):
    return render(request, 'purchases/edit.html')

def users(request):
    return render(request, 'users.html')

def staff(request):
    return render(request, 'staff.html')

def reports(request):
    return render(request, 'reports.html')
def reports_create(request):
    return render(request, 'reports/create.html')
def reports_update(request):
    return render(request, 'reports/update.html')
