import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import App from "./App";
import { AuthProvider } from "./auth/AuthProvider";
import { ToastProvider } from "./components/Toast";
import { ApiError } from "./api/client";
import "./i18n";
import "./index.css";

// Django serves the built index.html at /app/; in dev Vite serves it at the
// root, so the router base has to follow.
const BASENAME = import.meta.env.PROD ? "/app" : "/";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Connectivity in Lubumbashi is unreliable: keep data usable across a
      // brief drop rather than blanking the page, and don't hammer retries.
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // A 4xx will never succeed on retry; only nurse network/5xx blips.
        if (error instanceof ApiError && error.status < 500) return false;
        return failureCount < 2;
      },
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={BASENAME}>
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
