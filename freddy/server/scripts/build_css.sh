#!/usr/bin/env bash
# One-off CSS build (requires bun). Output static/css/app.css is committed;
# the server needs no Node/bun toolchain at runtime.
#
# Tailwind resolves the `@import "tailwindcss"` in static/src/app.css by
# walking up from that file looking for node_modules, so we briefly link
# scripts/node_modules at the server root for the duration of the build.
set -e
cd "$(dirname "$0")"
bun install --silent
cd ..
trap 'rm -f node_modules' EXIT
ln -sfn scripts/node_modules node_modules
bun run scripts/node_modules/.bin/tailwindcss -i static/src/app.css -o static/css/app.css --minify "$@"
