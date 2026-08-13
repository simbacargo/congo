# CLAUDE.md

Guidance for working in the **Freddy** repo.

## What this project is

A fuel-levy management platform for an NGO operating in **Lubumbashi, DR Congo**.
Fuel stations collect a small levy (2%) on fuel sales; the levy is tracked,
verified, and disbursed to partner churches. There is also a driver-registration
dataset for the "OSS" health program (moto-taxi / vehicle drivers).

Three deployables:

| Path | Stack | Role |
|------|-------|------|
| `server/` | Django 5.1 + DRF + Knox | Backend: web dashboard (server-rendered) + JSON API |
| `server/spa/` | Vite + React 19 + TS | New dashboard SPA, served by Django at `/app/` |
| `freddy_mobile/` | Expo / React Native (TS) | Offline-first field app for station agents |

> `kdcharite/` and `kdcharitewebsite/` are untracked and appear unrelated to Freddy.
> `server_v2/` is an **abandoned** Go/Echo rewrite — superseded by the SPA, do
> not extend it.

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

# SPA (run from server/spa/)
bun install
bun run dev                        # Vite on :5173, proxies /api → :8000
bun run build                      # → server/static/spa/, served at /app/
bun run typecheck

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

### Web frontend (v2, light "paper ledger" theme)

- Templates live in `server/html/` (`base.html` shell + `html/fuel/` pages/partials).
  Design tokens & component classes (`.card`, `.btn*`, `.field`, `.badge-<STATUS>`,
  `.tbl`, `.nav-link`) are defined in `static/src/app.css` (Tailwind v4 source).
- **All assets are vendored** (fonts, htmx, Chart.js under `static/`); no CDNs —
  connectivity in Lubumbashi is unreliable. Keep it that way.
- CSS build: `./scripts/build_css.sh` (uses bun, one-off; the minified output
  `static/css/app.css` is **committed**). Re-run after adding new Tailwind
  utility classes to templates. Django forms get widget classes from the
  `_FIELD_CLASSES` constants in `fuel_app/forms.py`.
- Web role gating: `fuel_app/decorators.py::role_required(*roles)` on views +
  matching `{% if %}` blocks in `base.html` nav. Superusers always pass.
- Chart styling: shared `static/js/charts.js` (`LCI` global — palette, status
  colors, Chart.js defaults). Pages that chart must override the `chart_lib`
  block to load Chart.js (base.html doesn't ship it).

### SPA (`server/spa/`) — the v3 dashboard

Replaces the server-rendered dashboard page by page. Both run side by side: the
Django UI keeps `/`, the SPA is mounted at `/app/` (`fuel_app.views.spa_index`
serves the built `static/spa/index.html` for every `/app/…` path; React Router
uses `basename="/app"`).

- **Backend is `/api/admin/`** (`fuel_app/admin_views.py` + `admin_urls.py`),
  Knox token auth. `GET /api/admin/me/` is the bootstrap call: identity,
  a `permissions` capability map, and the pending-transaction badge count.
- **Two separate access layers, don't conflate them.**
  `fuel_app/permissions.py` decides *who may call* an endpoint (all classes
  bypass for superusers); `fuel_app/scoping.py` decides *which rows* come back
  (`scope_transactions`, `scope_stations`, `scope_companies`, …). An
  out-of-scope UUID 404s rather than 403s. **An unassigned user gets `.none()`,
  never everything** — follow that rule in any new scope helper.
- **Design tokens are shared, not copied.** `static/src/_tokens.css` holds the
  tokens plus `.card` / `.btn*` / `.field` / `.badge-<STATUS>` / `.tbl` /
  `.nav-link`, and is imported by *both* `static/src/app.css` (Django pages) and
  `spa/src/index.css`. Edit component styles there so the two UIs can't drift.
- **No CDNs, ever** — Vite bundles everything; fonts stay vendored at
  `/static/fonts/`. Connectivity in Lubumbashi is unreliable.
- i18n is `react-i18next` with hand-authored `fr`/`en`/`sw` JSON under
  `spa/src/i18n/locales/`, French default. Independent of Django's `set_language`.
- Scoping is covered by `fuel_app/test_scoping.py` — run it after touching any
  queryset or permission class.

`drivers/<pk>/id-card/` stays server-rendered (embedded QR, Code128 barcode and
base64 logos in a print stylesheet); the SPA links out to it.

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
