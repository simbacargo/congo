"""
python manage.py seed_lci

Creates demo companies, stations, churches, fuel types, and one agent user
so the system is usable immediately after first migration.
"""
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Seed initial LCI demo data"

    def handle(self, *args, **options):
        from fuel_app.models import Church, FuelStation, FuelType, ParentCompany
        from authentication.models import User, ROLE_STATION_AGENT, ROLE_NGO_ADMIN

        # Fuel types
        fuels = [
            ("Diesel", "DSL"), ("Petrol", "PTR"), ("Kerosene", "KRS"),
            ("Gas Oil", "GSO"), ("Heavy Fuel Oil", "HFO"),
        ]
        for name, code in fuels:
            FuelType.objects.get_or_create(code=code, defaults={"name": name})
        self.stdout.write("  ✓ Fuel types")

        # Companies
        total, _ = ParentCompany.objects.get_or_create(
            code="TOTAL", defaults={"name": "TotalEnergies Lubumbashi", "contact_email": "lubs@total.com"}
        )
        engen, _ = ParentCompany.objects.get_or_create(
            code="ENGEN", defaults={"name": "Engen DRC", "contact_email": "drc@engen.co"}
        )
        self.stdout.write("  ✓ Companies")

        # Stations
        st1, _ = FuelStation.objects.get_or_create(
            code="TOTAL-LUB-01",
            defaults={"name": "Total Lubumbashi Centre", "company": total, "address": "Avenue Lumumba, Lubumbashi"},
        )
        st2, _ = FuelStation.objects.get_or_create(
            code="ENGEN-LUB-01",
            defaults={"name": "Engen Katuba", "company": engen, "address": "Route Kasumbalesa, Katuba"},
        )
        self.stdout.write("  ✓ Stations")

        # Churches
        Church.objects.get_or_create(
            name="Église de la Grâce",
            defaults={"station": st1, "contact_person": "Pasteur Mutombo", "contact_phone": "+243812345678", "beneficiary_count": 340},
        )
        Church.objects.get_or_create(
            name="Communauté Pentecôte Lumbumbashi",
            defaults={"station": st1, "contact_person": "Rev. Kabila", "beneficiary_count": 210},
        )
        Church.objects.get_or_create(
            name="Église Catholique Sainte-Anne",
            defaults={"station": st2, "contact_person": "Père Ilunga", "contact_phone": "+243892345678", "beneficiary_count": 580},
        )
        self.stdout.write("  ✓ Churches")

        # NGO Admin
        if not User.objects.filter(username="ngo_admin").exists():
            u = User.objects.create_user("ngo_admin", "admin1234!")
            u.role = ROLE_NGO_ADMIN
            u.is_active = True
            u.save()
            self.stdout.write("  ✓ NGO Admin user: ngo_admin / admin1234!")

        # Station Agent
        if not User.objects.filter(username="agent_total").exists():
            u = User.objects.create_user("agent_total", "agent1234!")
            u.role = ROLE_STATION_AGENT
            u.assigned_station = st1
            u.is_active = True
            u.save()
            self.stdout.write("  ✓ Agent user: agent_total / agent1234! (assigned to Total Centre)")

        self.stdout.write(self.style.SUCCESS("\nLCI seed data loaded successfully."))
