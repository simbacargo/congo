import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// The production build lands in ../static/spa/, which is already inside
// STATICFILES_DIRS, so collectstatic picks it up with no extra wiring. Django
// serves the built index.html at /app/ (see fuel_app.views.spa_index) and the
// hashed assets from /static/spa/.
//
// In dev, Vite serves from the root and proxies the API to Django on :8000,
// so the SPA runs at http://localhost:5173 with no Django template involved.
export default defineConfig(({ mode }) => ({
  base: mode === "production" ? "/static/spa/" : "/",
  plugins: [react(), tailwindcss()],
  // Mirrors the `@/*` paths mapping in tsconfig.json.
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  build: {
    outDir: "../static/spa",
    emptyOutDir: true,
    // Everything is bundled locally — connectivity in Lubumbashi is
    // unreliable, so the page must never reach for a CDN at runtime.
    rollupOptions: {
      output: {
        manualChunks: {
          charts: ["chart.js", "react-chartjs-2"],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://localhost:8000", changeOrigin: true },
      "/media": { target: "http://localhost:8000", changeOrigin: true },
    },
  },
}));
