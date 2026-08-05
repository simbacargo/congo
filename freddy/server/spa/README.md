# Freddy SPA

The v3 dashboard — React 19 + Vite + TypeScript, talking to Django's
`/api/admin/` with Knox tokens.

It runs **alongside** the server-rendered Django dashboard while it is built
out: Django keeps `/`, the SPA is mounted at `/app/`. Compare any page against
its Django twin (`/app/transactions` vs `/transactions/`) to check parity.

## Commands

Uses **bun**, never npm.

```bash
bun install
bun run dev        # Vite on :5173, proxies /api and /media to Django on :8000
bun run build      # → ../static/spa/, served by Django at /app/
bun run typecheck
bun test           # headless smoke tests (happy-dom)
```

For `bun run dev` you also need Django running: `python manage.py runserver`.

## How it is served

`vite.config.ts` sets `base: '/static/spa/'` for production builds and writes
into `../static/spa/`, which is already inside `STATICFILES_DIRS` — so
`collectstatic` picks it up with no extra wiring. `fuel_app.views.spa_index`
returns the built `index.html` for every `/app/…` path and React Router
(`basename="/app"`) takes it from there.

The build output is gitignored, so **the deploy host must run `bun run build`**.
See the note in `server/.gitignore` if you would rather commit it.

## Layout

```
src/
  api/client.ts      fetch wrapper: Token auth, 401 → sign-out, file downloads
  api/types.ts       response shapes mirroring the DRF serializers
  auth/              AuthProvider — session + /me/ bootstrap + capability checks
  charts/theme.ts    Chart.js theme, ported from static/js/charts.js
  components/        Card, KpiCard, StatusBadge, Pagination, Toast, …
  i18n/              react-i18next; fr (default) / en / sw
  layouts/AppShell   sidebar + topbar, nav driven by the /me/ permission map
  lib/format.ts      money/date formatting (money arrives as decimal strings)
  pages/             one file per route
```

## Conventions

- **Styling reuses the Django design system.** Tokens and component classes
  live in `../static/src/_tokens.css` and are imported by both this app and
  `static/src/app.css`. Edit them there, not here, so the two UIs can't drift.
- **No CDNs.** Everything is bundled; fonts stay vendored at `/static/fonts/`.
  Connectivity in Lubumbashi is unreliable — keep it that way.
- **Permissions come from the server.** Nav and write actions gate on the
  `permissions` map from `/api/admin/me/`, never on role strings in the client.
  The client guard is a usability affordance; the API is the security boundary.
- **Money is a string on the wire.** DRF sends decimals as strings (levies at
  4 dp, amounts at 2). Parse late, only for display — never accumulate in JS
  floats.

## Tests

`src/test/smoke.test.tsx` mounts the real app against a stubbed API and asserts
every route renders. It exists to catch what `tsc` and the bundler cannot — a
bad lazy import, a hook outside its provider, an optional chain one level too
short. Run it after touching routing, the shell, or a page's data shape.

`src/test/setup.tsx` pins the locale to `fr` and stubs `react-chartjs-2`;
happy-dom has no canvas context, and Chart.js retries context acquisition in a
loop that otherwise starves the event loop and causes random timeouts.

## Status

All routes are built: dashboard, transactions (+ detail, bulk actions),
companies / stations / churches (list, detail, forms), drivers (+ detail),
agents (+ detail, forms), my-history, disbursements, reports, audit, fuel
types, and the public verify page.
