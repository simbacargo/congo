"""
python manage.py import_drivers "/path/to/NOTRE BASA DE DONNEES CHAUFFEURS.xlsx"

Imports driver registrations from the Google Forms Excel export into the
Driver model. Idempotent: each row is keyed on the form submission timestamp
(Horodateur) by default, so re-running the command updates existing records
rather than creating duplicates.

Some exports (e.g. "PRINCIPPALE BASE DE DONNEES") have no Horodateur column;
for those, key on the driver's phone number instead:

  python manage.py import_drivers FILE.xlsx --key phone --replace

Options:
  --dry-run   Parse and report counts without writing to the database.
  --sheet     Worksheet name to read (default: the active/first sheet).
  --key       Idempotency key: 'submitted_at' (default) or 'phone'. With
              'phone', the driver's normalized phone de-duplicates rows.
  --replace   Delete ALL existing drivers first, then import (full reload).
              Wrapped in a transaction, so a parse error rolls back the delete.
"""
import re
from datetime import date, datetime

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone


# Driver model field -> the French header label(s) it may appear under.
# Multiple labels per field because the source spreadsheets come from
# different Google-Form revisions with slightly different wording; the first
# label present in the file wins. Matching is whitespace/case-insensitive
# (see _norm), so only genuinely different wording needs a new entry.
COLUMN_MAP = {
    "submitted_at": ["Horodateur"],
    "score": ["Score"],
    "gender": ["Sexe"],
    "phone": ["Numéro téléphone", "Numéro Téléphone (WhatsApp ou Normal)"],
    "full_name": ["Nom complet", "Nom Complet en Majuscule"],
    "marital_status": ["État - civil", "État-civil"],
    "commune": ["Commune"],
    "quartier": ["Quartier"],
    "city_country": ["Ville et Pays"],
    "vehicle_type": ["Quel type de véhicule"],
    "vehicle_color": ["Couleur véhicule"],
    "daily_fuel_consumption": [
        "Consommation carburant par jour (en littres)",
        "Consommation carburant par jour (en Littres)",
    ],
    "fuel_type": ["Type de carburant"],
    "has_health_coverage": ["Avez-vous déjà une couverture santé ?"],
    "has_care_access_difficulty": ["Avez-vous des difficultés à un accès aux soins de qualité ?"],
    "dependents": [
        "Quel nombre de personnes sont à votre charge ?",
        "Quel nombre de personne sont à votre charge",
    ],
    "field_agent": ["Nom de l'Agent-terrain", "Nom de l'Agent - terrain"],
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
        parser.add_argument(
            "--key", choices=["submitted_at", "phone"], default="submitted_at",
            help="Idempotency key. 'submitted_at' (default) for exports with a "
                 "Horodateur column; 'phone' for exports without one.",
        )
        parser.add_argument(
            "--replace", action="store_true",
            help="Delete ALL existing drivers before importing (full reload). "
                 "Runs in a transaction, so a parse error rolls back the delete.",
        )

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

        from django.db import transaction
        from fuel_app.services import normalize_phone

        key_field = options["key"]

        # ── Pass 1: parse every row, de-duplicating within the file ──────────
        # For the phone key, a normalized phone appearing twice keeps the LAST
        # occurrence (spreadsheets are edited top-down, so later rows are more
        # current). Rows with no key value are always kept as separate records.
        keyed = {}          # key value -> data (last wins)
        keyless = []        # rows with no usable key value
        in_file_dupes = 0
        skipped = 0

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

            if key_field == "phone":
                key = normalize_phone(data.get("phone")) or None
            else:
                key = data.get("submitted_at")

            if key is None:
                keyless.append(data)
            else:
                if key in keyed:
                    in_file_dupes += 1
                keyed[key] = data

        wb.close()

        total = len(keyed) + len(keyless)

        if options["dry_run"]:
            existing = Driver.objects.count()
            self.stdout.write(self.style.SUCCESS(
                f"[dry-run] key={key_field} replace={options['replace']}\n"
                f"  {total} records would be written "
                f"({len(keyed)} keyed on {key_field}, {len(keyless)} keyless).\n"
                f"  {in_file_dupes} duplicate {key_field}(s) collapsed within the file.\n"
                f"  {skipped} blank rows skipped.\n"
                f"  DB drivers now: {existing}"
                + (f" -> {total} after replace." if options["replace"]
                   else f" -> up to {existing + len(keyless)}+ after upsert.")
            ))
            return

        created = updated = deleted = 0
        with transaction.atomic():
            if options["replace"]:
                deleted = Driver.objects.count()
                Driver.objects.all().delete()

            if options["replace"]:
                # Table is empty (or being replaced): a straight bulk insert is
                # far faster than per-row upserts for a few thousand rows.
                Driver.objects.bulk_create(
                    [Driver(**d) for d in list(keyed.values()) + keyless],
                    batch_size=500,
                )
                created = total
            else:
                for data in list(keyed.values()):
                    if key_field == "phone":
                        # Match on the STORED phone string; normalization already
                        # collapsed same-number variants during parsing, so at
                        # most one existing row can carry this exact value.
                        existing = Driver.objects.filter(phone=data.get("phone")).first()
                    else:
                        existing = Driver.objects.filter(
                            submitted_at=data.get("submitted_at")
                        ).first()
                    if existing:
                        for f, v in data.items():
                            setattr(existing, f, v)
                        existing.save()
                        updated += 1
                    else:
                        Driver.objects.create(**data)
                        created += 1
                for data in keyless:
                    Driver.objects.create(**data)
                    created += 1

        self.stdout.write(self.style.SUCCESS(
            f"Done. {deleted} deleted, {created} created, {updated} updated, "
            f"{skipped} blank rows skipped, {in_file_dupes} in-file dupes collapsed. "
            f"Total drivers now: {Driver.objects.count()}"
        ))
