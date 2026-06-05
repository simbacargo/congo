# Beta Notes — Freddy (server)

Status: **dev-to-dev beta**. The UX items below are done; the security/deploy
blockers are intentionally **deferred** and MUST be resolved before any public,
internet-facing launch.

---

## ✅ Done for this beta

- **Drivers** imported (1,331 records) and exposed in the dashboard
  (`/drivers/`) with search, filters, pagination, per-driver detail page, and a
  filtered Excel export. See [CLAUDE.md](CLAUDE.md) → *Data imports*.
- **Export buttons scoped** — the transaction Excel/PDF export only shows on
  Dashboard / Transactions / Reports (no longer misleading on other pages).
- **French is the default UI language**; new strings translated and compiled.

---

## 🔴 Deploy blockers — DO NOT skip before a public launch

These are flagged by `python manage.py check --deploy`. All live in
`server/server/settings.py` unless noted.

| # | Issue | Fix |
|---|-------|-----|
| 1 | `DEBUG = True` | Drive from env: `DEBUG = os.environ.get("DEBUG") == "1"`. Must be `False` in prod (otherwise tracebacks + settings leak to users). |
| 2 | Hard-coded `SECRET_KEY` (committed, `django-insecure-…` prefix) | Load from env; generate a fresh 50+ char random key. Rotating it invalidates existing sessions (expected). |
| 3 | **Static files broken for prod** | `STATIC_DIRS` (line ~120) is a typo — the real setting is `STATICFILES_DIRS`, so it's silently ignored. `STATIC_ROOT` also points at the *same* `static/` dir, which breaks `collectstatic`. With `DEBUG=False`, CSS/JS won't load. Fix the setting name, point `STATIC_ROOT` at a separate dir (e.g. `staticfiles/`), and serve via WhiteNoise or nginx. |
| 4 | `CORS_ALLOW_ALL_ORIGINS = True` | Any site can call the API. Replace with `CORS_ALLOWED_ORIGINS = [...]` for the mobile app / dashboard origins. |
| 5 | SQLite, committed in git (`db.sqlite3`) | OK for demo; risky for multi-user beta (write concurrency) and a deploy can clobber live data. Move to Postgres for production and ensure the DB file isn't overwritten on deploy. |
| 6 | No HTTPS hardening | When served over HTTPS set: `SECURE_SSL_REDIRECT`, `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`, and consider `SECURE_HSTS_SECONDS`. |

### Suggested approach
Split settings via environment variables (one `settings.py`, env-driven), or a
`settings/base.py` + `prod.py` split. Keep secrets in env / a `.env` (gitignored),
never in source.

---

## 🟢 Nice-to-have (post-beta)

- `db.sqlite3` and `*.pyc` are tracked in git — add a `.gitignore` and untrack.
- The GNU `gettext` CLI isn't installed; translations are compiled with `polib`.
  Installing `gettext` lets you use the standard `makemessages`/`compilemessages`.
- Driver records have ~29 duplicate phone numbers and minor dropdown typos in the
  source data (stored as-is) — clean up if/when needed.
