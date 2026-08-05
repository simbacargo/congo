# Freddy frontend

Standalone Svelte/Vite frontend for the Django admin APIs. The existing
`spa/` application is intentionally separate and is not used by this app.

## Development

```sh
bun install
bun run dev
```

Open `http://127.0.0.1:5174/frontend/` while Django is running on port 8000.
Vite proxies `/api` requests to Django.

## Verification and deployment

```sh
bun run typecheck
bun run test
bun run build
```

The production build is written to `static/frontend/` and is served by Django
at `/frontend/`.
