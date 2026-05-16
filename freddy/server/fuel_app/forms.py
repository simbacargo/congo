from django import forms
from fuel_app.models import (
    Church, Disbursement, FuelStation, FuelType, ParentCompany, Transaction, StationTarget
)
from authentication.models import User, ROLE_STATION_AGENT, ROLE_COMPANY_MANAGER, ROLE_NGO_ADMIN

_FIELD_CLASSES = "w-full bg-gray-900 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
_SELECT_CLASSES = "w-full bg-gray-900 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
_TEXTAREA_CLASSES = "w-full bg-gray-900 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
_CHECK_CLASSES = "w-4 h-4 accent-blue-600"


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
            user.set_password(User.objects.make_random_password())
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
    search = forms.CharField(required=False, widget=forms.TextInput(attrs={"placeholder": "Receipt code, church, station…"}))
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
