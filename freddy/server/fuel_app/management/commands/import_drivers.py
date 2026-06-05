"""
python manage.py import_drivers "/path/to/NOTRE BASA DE DONNEES CHAUFFEURS.xlsx"

Imports driver registrations from the Google Forms Excel export into the
Driver model. Idempotent: each row is keyed on the form submission timestamp
(Horodateur), so re-running the command updates existing records rather than
creating duplicates.

Options:
  --dry-run   Parse and report counts without writing to the database.
  --sheet     Worksheet name to read (default: the active/first sheet).
"""
import re
from datetime import date, datetime

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone


# Driver model field -> the French header label(s) it may appear under.
COLUMN_MAP = {
    "submitted_at": ["Horodateur"],
    "score": ["Score"],
    "gender": ["Sexe"],
    "phone": ["Numéro téléphone"],
    "full_name": ["Nom complet"],
    "marital_status": ["État - civil", "État-civil"],
    "commune": ["Commune"],
    "quartier": ["Quartier"],
    "city_country": ["Ville et Pays"],
    "vehicle_type": ["Quel type de véhicule"],
    "vehicle_color": ["Couleur véhicule"],
    "daily_fuel_consumption": ["Consommation carburant par jour (en littres)"],
    "fuel_type": ["Type de carburant"],
    "has_health_coverage": ["Avez-vous déjà une couverture santé ?"],
    "has_care_access_difficulty": ["Avez-vous des difficultés à un accès aux soins de qualité ?"],
    "dependents": ["Quel nombre de personnes sont à votre charge ?"],
    "field_agent": ["Nom de l'Agent-terrain"],
    "consent": ["Consentement"],
    "email": ["Adresse e-mail"],
    "registration_date": ["Date d'enregistrement"],
}

BOOL_FIELDS = {"has_health_coverage", "has_care_access_difficulty"}


def _norm(text):
    """Normalize a header label for tolerant matching."""
    return re.sub(r"\s+", " ", str(text or "").strip().lower())


def _clean_str(value):
    if value is None:
        return None
    s = str(value).strip()
    return s or None


def _to_bool(value):
    s = _clean_str(value)
    if s is None:
        return None
    s = s.lower()
    if s.startswith("oui"):
        return True
    if s.startswith("non"):
        return False
    return None


class Command(BaseCommand):
    help = "Import driver registrations from the chauffeurs Excel export."

    def add_arguments(self, parser):
        parser.add_argument("path", help="Path to the .xlsx file")
        parser.add_argument("--sheet", default=None, help="Worksheet name (default: active sheet)")
        parser.add_argument("--dry-run", action="store_true", help="Parse without writing to the DB")

    def handle(self, *args, **options):
        try:
            import openpyxl
        except ImportError as exc:
            raise CommandError("openpyxl is required: pip install openpyxl") from exc

        from fuel_app.models import Driver

        path = options["path"]
        try:
            wb = openpyxl.load_workbook(path, data_only=True, read_only=True)
        except FileNotFoundError as exc:
            raise CommandError(f"File not found: {path}") from exc

        ws = wb[options["sheet"]] if options["sheet"] else wb.active
        rows = ws.iter_rows(values_only=True)

        try:
            header = next(rows)
        except StopIteration:
            raise CommandError("Spreadsheet is empty")

        # Build a {normalized header label -> column index} lookup.
        header_index = {_norm(h): i for i, h in enumerate(header) if h is not None}

        # Resolve each model field to a column index.
        field_col = {}
        missing = []
        for field, labels in COLUMN_MAP.items():
            for label in labels:
                idx = header_index.get(_norm(label))
                if idx is not None:
                    field_col[field] = idx
                    break
            else:
                missing.append(field)
        if missing:
            self.stdout.write(self.style.WARNING(
                f"Columns not found (left blank): {', '.join(missing)}"
            ))

        created = updated = skipped = 0
        seen_keys = set()

        for row in rows:
            if not any(c not in (None, "") for c in row):
                skipped += 1
                continue

            data = {}
            for field, idx in field_col.items():
                raw = row[idx]
                if field == "submitted_at":
                    if isinstance(raw, datetime):
                        data[field] = (
                            timezone.make_aware(raw) if timezone.is_naive(raw) else raw
                        )
                    else:
                        data[field] = None
                elif field == "registration_date":
                    if isinstance(raw, datetime):
                        data[field] = raw.date()
                    elif isinstance(raw, date):
                        data[field] = raw
                    else:
                        data[field] = None
                elif field == "score":
                    try:
                        data[field] = int(raw) if raw is not None else 0
                    except (TypeError, ValueError):
                        data[field] = 0
                elif field == "consent":
                    data[field] = _clean_str(raw) is not None
                elif field in BOOL_FIELDS:
                    data[field] = _to_bool(raw)
                else:
                    data[field] = _clean_str(raw)

            key = data.get("submitted_at")
            if key is not None:
                if key in seen_keys:
                    # Duplicate submission timestamp within the file — skip the
                    # second occurrence so the unique key import stays stable.
                    skipped += 1
                    continue
                seen_keys.add(key)

            if options["dry_run"]:
                created += 1
                continue

            if key is not None:
                _, was_created = Driver.objects.update_or_create(
                    submitted_at=key, defaults=data
                )
            else:
                # No timestamp to key on — always create a fresh record.
                Driver.objects.create(**data)
                was_created = True
            created += int(was_created)
            updated += int(not was_created)

        wb.close()

        if options["dry_run"]:
            self.stdout.write(self.style.SUCCESS(
                f"[dry-run] {created} rows would be imported, {skipped} skipped."
            ))
        else:
            self.stdout.write(self.style.SUCCESS(
                f"Done. {created} created, {updated} updated, {skipped} skipped. "
                f"Total drivers now: {Driver.objects.count()}"
            ))
