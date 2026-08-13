from django import forms
from django.utils.crypto import get_random_string
from fuel_app.models import (
    Church, Disbursement, FuelStation, FuelType, ParentCompany, Transaction, StationTarget
)
from authentication.models import User, ROLE_STATION_AGENT, ROLE_COMPANY_MANAGER, ROLE_NGO_ADMIN

# v2 component classes defined in static/src/app.css
_FIELD_CLASSES = "field"
_SELECT_CLASSES = "field"
_TEXTAREA_CLASSES = "field field-textarea"
_CHECK_CLASSES = "check"


def _apply(form):
    for name, field in form.fields.items():
        w = field.widget
        if isinstance(w, forms.CheckboxInput):
            w.attrs["class"] = _CHECK_CLASSES
        elif isinstance(w, (forms.Select, forms.SelectMultiple)):
            w.attrs["class"] = _SELECT_CLASSES
        elif isinstance(w, forms.Textarea):
            w.attrs["class"] = _TEXTAREA_CLASSES
            w.attrs.setdefault("rows", 3)
        else:
            w.attrs["class"] = _FIELD_CLASSES
    return form


class ParentCompanyForm(forms.ModelForm):
    class Meta:
        model = ParentCompany
        fields = ["name", "code", "contact_email", "contact_phone", "logo", "is_active"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        _apply(self)


class FuelStationForm(forms.ModelForm):
    class Meta:
        model = FuelStation
        fields = ["name", "code", "company", "address", "latitude", "longitude", "is_active"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["company"].queryset = ParentCompany.objects.filter(is_active=True).order_by("name")
        _apply(self)


class ChurchForm(forms.ModelForm):
    class Meta:
        model = Church
        fields = ["name", "station", "contact_person", "contact_phone", "beneficiary_count", "is_active"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["station"].queryset = FuelStation.objects.filter(is_active=True).select_related("company").order_by("company__name", "name")
        _apply(self)


class FuelTypeForm(forms.ModelForm):
    class Meta:
        model = FuelType
        fields = ["name", "code", "is_active"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        _apply(self)


class TransactionStatusForm(forms.ModelForm):
    class Meta:
        model = Transaction
        fields = ["status", "notes"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        _apply(self)


class AgentForm(forms.ModelForm):
    password = forms.CharField(
        widget=forms.PasswordInput, required=False,
        help_text="Leave blank to keep existing password."
    )

    class Meta:
        model = User
        fields = ["username", "firstname", "lastname", "email", "mobile", "role",
                  "assigned_station", "managed_company", "is_active", "password"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["assigned_station"].queryset = FuelStation.objects.filter(is_active=True).select_related("company")
        self.fields["managed_company"].queryset = ParentCompany.objects.filter(is_active=True)
        self.fields["assigned_station"].required = False
        self.fields["managed_company"].required = False
        self.fields["email"].required = False
        _apply(self)

    def save(self, commit=True):
        user = super().save(commit=False)
        pwd = self.cleaned_data.get("password")
        if pwd:
            user.set_password(pwd)
        elif not user.pk:
            # An unusable random password: the account exists but can only be
            # entered once an admin sets a real one.
            user.set_password(get_random_string(32))
        if commit:
            user.save()
        return user


class DisbursementForm(forms.ModelForm):
    class Meta:
        model = Disbursement
        fields = ["church", "period_start", "period_end", "amount_usd", "amount_cdf",
                  "payment_method", "status", "notes"]
        widgets = {
            "period_start": forms.DateInput(attrs={"type": "date"}),
            "period_end": forms.DateInput(attrs={"type": "date"}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["church"].queryset = Church.objects.filter(is_active=True).select_related("station__company")
        _apply(self)


class StationTargetForm(forms.ModelForm):
    class Meta:
        model = StationTarget
        fields = ["station", "year", "month", "target_usd"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["station"].queryset = FuelStation.objects.filter(is_active=True).select_related("company")
        _apply(self)


class TransactionFilterForm(forms.Form):
    search = forms.CharField(required=False, widget=forms.TextInput(attrs={"placeholder": "Receipt code or station…"}))
    company = forms.ModelChoiceField(queryset=ParentCompany.objects.all(), required=False, empty_label="All Companies")
    station = forms.ModelChoiceField(queryset=FuelStation.objects.all(), required=False, empty_label="All Stations")
    status = forms.ChoiceField(
        choices=[("", "All Statuses")] + list(Transaction.Status.choices),
        required=False
    )
    date_from = forms.DateField(required=False, widget=forms.DateInput(attrs={"type": "date"}))
    date_to = forms.DateField(required=False, widget=forms.DateInput(attrs={"type": "date"}))

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        _apply(self)
