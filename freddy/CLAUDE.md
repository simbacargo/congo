# CLAUDE.md

Guidance for working in the **Freddy** repo.

## What this project is

A fuel-levy management platform for an NGO operating in **Lubumbashi, DR Congo**.
Fuel stations collect a small levy (2%) on fuel sales; the levy is tracked,
verified, and disbursed to partner churches. There is also a driver-registration
dataset for the "OSS" health program (moto-taxi / vehicle drivers).

Two deployables:

| Path | Stack | Role |
|------|-------|------|
| `server/` | Django 5.1 + DRF + Knox | Backend: web dashboard (server-rendered) + JSON API |
| `freddy_mobile/` | Expo / React Native (TS) | Offline-first field app for station agents |

> `kdcharite/` and `kdcharitewebsite/` are untracked and appear unrelated to Freddy.

## Environment & commands

- **Python venv lives at `/home/david/.venv`**, not in the repo. Activate with
  `source /home/david/.venv/bin/activate` before any `manage.py` command.
- **Mobile uses `bun`** — use `bun add` / `bun install`, never npm.

```bash
# Backend (run from server/)
source /home/david/.venv/bin/activate
python manage.py migrate
python manage.py runserver
python manage.py seed_lci          # demo companies/stations/churches/agent

# Mobile (run from freddy_mobile/)
bun install
bun start                          # expo; --android / --ios / --web
```

## Backend layout (`server/`)

- `fuel_app/` — the core domain. `models.py` holds `ParentCompany`, `FuelStation`,
  `Church`, `FuelType`, `Transaction`, `TransactionAuditLog`, `ExchangeRateCache`,
  `Disbursement`, `StationTarget`, and `Driver`.
- `authentication/` — custom user model (`AUTH_USER_MODEL = authentication.User`,
  username-based). Token auth via **Knox** at `/api/auth/`.
- `fuel_app/services.py` — USD↔CDF exchange-rate fetch/cache (open.er-api.com,
  30-min cache, fallback rate).
- `fuel_app/urls.py` — server-rendered dashboard views **plus** a JSON API under
  `/api/` (the mobile app's backend). Web views and API views coexist in `views.py`.
- i18n: English / French / Swahili (`locale/en|fr|sw`). DB is SQLite (`db.sqlite3`).

### Domain conventions

- Primary keys are **UUIDs** on the main models.
- `Transaction.save()` auto-computes levy + currency conversion and generates a
  `receipt_code` (`LCI-XXXX-XXXX-CKSM`). Transactions are treated as immutable
  (admin blocks deletes; audit log records field changes).
- Offline sync: transactions carry a `sync_id`; the API exposes
  `/api/transactions/sync/` for bulk upload from the mobile app.

## Mobile layout (`freddy_mobile/`)

- `app/` — Expo Router screens (`(tabs)/`, `transaction/`, `login`, `verify`).
- `lib/api.ts` — API client; base URL from `expoConfig.extra.apiBase`, defaulting
  to `10.0.2.2:8000` (Android emulator) / `localhost:8000`.
- `lib/db.ts` — local SQLite (expo-sqlite); `lib/sync.ts` — offline sync logic;
  `lib/print.ts` — receipt printing/sharing.

## Data imports

The `Driver` model is populated from a Google Forms Excel export via:

```bash
python manage.py import_drivers "/path/to/NOTRE BASA DE DONNEES CHAUFFEURS.xlsx"
# --dry-run to preview, --sheet NAME to pick a worksheet
```

The importer is **idempotent**: rows are keyed on the form submission timestamp
(`Driver.submitted_at`), so re-running updates rather than duplicates. Categorical
values are stored as received (no normalization); Yes/No answers map to nullable
booleans; range answers (e.g. "5 à 10") are kept as text.

## Notes / gotchas

- `db.sqlite3` and `*.pyc` are currently tracked in git — avoid committing churn
  in them unless intended.
- `USE_TZ = True` — pass timezone-aware datetimes (see `import_drivers` for the
  `make_aware` pattern when reading naive datetimes from spreadsheets).
- **i18n**: default language is French (`LANGUAGE_CODE = 'fr'`; also en/sw). The
  GNU `gettext` CLI is **not installed**, so `manage.py compilemessages` won't run.
  Translations in `locale/fr/LC_MESSAGES/django.po` are compiled to `.mo` with
  `polib` instead (`pip install polib`; `polib.pofile(path).save_as_mofile(...)`).
  After adding `{% trans %}` strings, add the French entry to the `.po` and
  recompile the `.mo`, or run `apt install gettext` to use the standard tooling.
