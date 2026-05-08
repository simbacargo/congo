from django.http import HttpResponse
from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate
from .forms import SignupForm
from django.contrib.sites.shortcuts import get_current_site
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.template.loader import render_to_string
# from core.tokens import account_activation_token
from django.core.mail import EmailMessage
from django.views.decorators.csrf import csrf_exempt
import json
from django import forms
from django.views import View
from django.contrib.auth import (
    authenticate, get_user_model, password_validation,
)
User = get_user_model()


@csrf_exempt
def signup_api(request):
    if request.method == 'POST':
        body_unicode  = request.body.decode('utf-8')
        body = json.loads(body_unicode)
        username:str = body['name']
        email:str = body['email']
        mobile:int = body['phonenumber']
        password:str = body['password']
        user=User.objects.create_user(
            username=username,
            email=email,
            # is_active = 1,
            mobile=mobile,
            password=password,)
        user.save()
        return HttpResponse({'0':'k'})
    else:
        return KeyError



from django.http import JsonResponse, HttpResponse
import random
def is_htmx_request(request):
    return 'HX-Request' in request.headers

def signup(request):
    if request.method == 'POST':
        form = SignupForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            user.is_active = False
            new_password = form.cleaned_data.get('password1')  # Use 'password1' as it’s the field for the password
            user.set_password(new_password)
            user.save()

            # Sending email
            current_site = get_current_site(request)
            account_activation_token = random.randint(1000,9999)
            message = render_to_string('authentication/acc_active_email.html', {
                'user': user,
                'domain': current_site.domain,
                'uid': urlsafe_base64_encode(force_bytes(user.pk)),
                # 'token': account_activation_token.make_token(user),
                'token': account_activation_token,
            })
            mail_subject = 'Activate your account In Bin Suleiman Systems.'
            to_email = form.cleaned_data.get('email')
            email = EmailMessage(mail_subject, message, to=[to_email])
            # email.send()

            if is_htmx_request(request):
                return JsonResponse({'message': 'Please confirm your email address to complete the registration'}, status=200)
            else:
                return HttpResponse('Please confirm your email address to complete the registration')

        else:
            if is_htmx_request(request):
                # Convert form errors to a format suitable for JSON response
                errors = form.errors.get_json_data()
                return JsonResponse({'errors': errors}, status=400)
            else:
                # Render form with errors for non-HTMX requests
                return render(request, 'registration/signup.html', {'form': form})

    else:
        form = SignupForm()

    return render(request, 'registration/signup.html', {'form': form})
    
from django.urls import reverse
def activate(request, uidb64, token: str):
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except(TypeError, ValueError, OverflowError, User.DoesNotExist):
        user = None
    if user is not None and account_activation_token.check_token(user, token):
        user.is_active = True
        user.save()
        login(request, user)
        # return redirect('home')
        # return redirect(reverse('payment:process'))
        return render(request, 'authentication/thanx.html')
    else:
        return render(request, 'authentication/thanx.html')



class ProfileForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ['username', 'email', 'firstname', 'lastname', 'language' ]  # Add other fields as necessary


from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.template.loader import render_to_string
from django.views import View

class ProfileUpdateView(View):
    model = User
    template_name = 'profile.html'
    form_class = ProfileForm

    def get(self, request, *args, **kwargs):
        user = request.user
        form = self.form_class(instance=user)
        return render(request, self.template_name, {'form': form})

    def post(self, request, *args, **kwargs):
        user = request.user
        form = self.form_class(request.POST, instance=user)

        if form.is_valid():
            form.save()
            # HTMX response: render success message
            message = "Profile updated successfully!"
            return JsonResponse({
                'message': message,
                'success': True
            })
        
        else:
            print(form.errors)  
            # HTMX response: return the form with errors
            return JsonResponse({
                'message': "There were errors in the form.",
                'success': False,
                'errors': form.errors,
                # 'form_html': render_to_string(self.template_name, {'form': form}, request=request),
            })

from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

# Serializer for registration (sign up)
class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user

# Serializer for login (returns JWT)
class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        user = User.objects.filter(username=data['username']).first()

        if user and user.check_password(data['password']):
            refresh = RefreshToken.for_user(user)
            return {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        raise serializers.ValidationError("Invalid credentials")

from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

# Sign up view
class RegisterView(APIView):
    def post(self, request):
        serializer = UserRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({"message": "User created successfully!"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Login view
class LoginView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            return Response(serializer.validated_data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    permission_classes = [permissions.AllowAny]

# Logout view (to blacklist JWT)
class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            # Blacklist the token
            token = request.auth
            token.blacklist()
            return Response({"message": "Successfully logged out!"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

#from django.contrib.auth.models import User
from .models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from knox.models import AuthToken
from google.oauth2 import id_token
from google.auth.transport import requests

class GoogleLoginView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        token = request.data.get('token')
        try:
            # Verify the token with Google
            # Note: 'token' from React @react-oauth/google is usually the 'credential' (ID Token)
            print ("token",token)
            idinfo = id_token.verify_oauth2_token(token, requests.Request())
            print (idinfo)

            # ID information returned by Google
            email = idinfo.get('email')
            firstname = idinfo.get('given_name', '')
            lastname = idinfo.get('family_name', '')
            print (email, firstname, lastname)
            # Get or create user in your local Django DB
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email, # Or generate a unique username
                    'firstname': firstname,
                    'lastname': lastname,
                }
            )

            # Create Knox Token
            _, knox_token = AuthToken.objects.create(user)

            # Return user info + token
            return Response({
                "success": True,
                "access": knox_token,
                "user": {
                    "username": user.username,
                    "email": user.email,
                    "firstname": user.firstname,
                    "lastname": user.lastname,
                }
            }, status=status.HTTP_200_OK)

        except ValueError:
            # Invalid token
            return Response(
                {"message": "Invalid Google token"}, 
                status=status.HTTP_400_BAD_REQUEST
            )


import requests # Use the standard python requests library
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
#from django.contrib.auth.models import User
from knox.models import AuthToken

class GoogleLoginView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        access_token = request.data.get('token')
        
        # 1. Verify the Access Token by calling Google's userinfo API
        user_info_res = requests.get(
            'https://www.googleapis.com/oauth2/v3/userinfo',
            params={'access_token': access_token}
        )
        
        if not user_info_res.ok:
            return Response({"message": "Invalid Google token"}, status=status.HTTP_400_BAD_REQUEST)

        idinfo = user_info_res.json()

        # 2. Get user details from the response
        email = idinfo.get('email')
        firstname = idinfo.get('given_name', '')
        lastname = idinfo.get('family_name', '')

        # 3. Standard user logic
        user, _ = User.objects.get_or_create(
            email=email,
            defaults={
                'username': email, 
                'firstname': firstname,
                'lastname': lastname,
            }
        )

        # 4. Create Knox Token
        _, knox_token = AuthToken.objects.create(user)

        return Response({
            "success": True,
            "access": knox_token,
            "user": {
                "username": user.username,
                "email": user.email,
            }
        })
