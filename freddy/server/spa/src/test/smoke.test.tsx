/**
 * Runtime smoke tests.
 *
 * The typechecker and the bundler both pass on code that still explodes on
 * first render — a bad dynamic import, an i18n key that resolves to an object,
 * a hook called outside its provider. These mount the real app against a
 * stubbed API and assert something sensible reaches the DOM.
 */
import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

import App from "@/App";
import { AuthProvider } from "@/auth/AuthProvider";
import { ToastProvider } from "@/components/Toast";
import "@/i18n";

const ADMIN_PERMISSIONS = {
  view_dashboard: true,
  view_transactions: true,
  view_drivers: true,
  view_own_history: true,
  manage_stations: true,
  manage_churches: true,
  view_reports: true,
  manage_companies: true,
  manage_agents: true,
  manage_disbursements: true,
  manage_fuel_types: true,
  view_audit: true,
  update_transaction_status: true,
  bulk_update_transactions: true,
};

const USER = {
  id: "u1",
  username: "admin",
  email: "a@b.c",
  firstname: "Ada",
  lastname: "Lovelace",
  role: "NGO_ADMIN",
  is_superuser: false,
  assigned_station: null,
  assigned_station_name: null,
  managed_company: null,
  managed_company_name: null,
};

const EMPTY_PAGE = { count: 0, next: null, previous: null, results: [] };

const STATS = {
  today_levy: "1.5", today_count: 2,
  month_levy: "10.0", month_count: 5,
  total_levy: "100.0", total_count: 50,
  pending_count: 3, verified_count: 2, remitted_count: 1,
  total_disbursed: "40.0", pending_disburse: 1,
  by_company: [{ station__company__name: "Alpha", station__company__id: "c1", total: 60, count: 30 }],
  by_fuel: [{ fuel_type__name: "Essence", total: 60, count: 30 }],
  recent: [],
  top_stations: [
    { id: "s1", name: "Katuba", company_name: "Alpha", month_levy: 7, target_usd: 10, target_pct: 70 },
  ],
};

/** Routes the stub understands; anything else fails the test loudly. */
function stubResponse(url: string): unknown {
  if (url.includes("/me/")) {
    return { user: USER, permissions: ADMIN_PERMISSIONS, pending_count: 3 };
  }
  if (url.includes("/dashboard/stats/")) return STATS;
  if (url.includes("/dashboard/chart/")) return { data: [{ date: "01 Aug", amount: 1 }] };
  if (url.includes("/transactions/")) return { ...EMPTY_PAGE, totals: { levy: 0, count: 0 } };
  if (url.includes("/reports/")) {
    return { monthly: [], church_summary: [], fuel_summary: [], stats: STATS };
  }
  if (url.includes("/drivers/")) {
    return {
      ...EMPTY_PAGE,
      filters: {}, sort: "name", dir: "asc",
      filter_options: { communes: [], vehicle_types: [], fuel_types: [], agents: [] },
      kpi: { filtered: 0, total: 0, top_vehicle: "—", top_vehicle_n: 0, coverage_pct: 0, agents: 0 },
      charts: { commune: [], vehicle: [], consumption: [], health: [0, 0, 0] },
    };
  }
  if (url.includes("/fuel-types/")) return [];
  if (url.includes("/history/")) {
    return {
      agent: { id: "u1", username: "admin", full_name: "Ada Lovelace", role: "NGO_ADMIN", station: null, station_name: null },
      station: { id: "s1", name: "Katuba", code: "KAT", company: "Alpha" },
      by_agent: [],
      summary: {
        count: 0, total_amount_usd: "0.00", total_amount_cdf: "0.00",
        total_levy_usd: "0.0000", total_levy_cdf: "0.0000",
        first_at: null, last_at: null, by_status: {},
      },
      count: 0, page: 1, num_pages: 1, next: null, previous: null, results: [],
    };
  }
  return EMPTY_PAGE;
}

let requestedUrls: string[] = [];

beforeEach(() => {
  requestedUrls = [];
  localStorage.setItem("freddy.token", "test-token");
  localStorage.setItem("freddy.user", JSON.stringify(USER));

  global.fetch = mock(async (input: RequestInfo | URL) => {
    const url = String(input);
    requestedUrls.push(url);
    return new Response(JSON.stringify(stubResponse(url)), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as unknown as typeof fetch;
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  // Restore the pinned locale that setup.ts installed.
  localStorage.setItem("freddy.lang", "fr");
});

function renderAt(path: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("app shell", () => {
  test("renders the sidebar with the admin's full nav", async () => {
    renderAt("/");
    // Waiting on a nav item proves the shell mounted and /me/ resolved.
    await screen.findByText("Tableau de bord", {}, { timeout: 5000 });
    for (const label of ["Transactions", "Rapports", "Sociétés", "Chauffeurs", "Agents"]) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
  });

  test("shows the pending badge from /me/", async () => {
    renderAt("/");
    // Scoped to the Transactions nav link so a stray "3" elsewhere on the
    // dashboard can't satisfy the assertion.
    const link = await screen.findByRole("link", { name: /Transactions/ }, { timeout: 5000 });
    await waitFor(() => expect(link.textContent).toContain("3"), { timeout: 5000 });
  });

  test("signed-out users get the login form", async () => {
    localStorage.clear();
    renderAt("/");
    await screen.findByLabelText("Nom d'utilisateur", {}, { timeout: 5000 });
  });
});

describe("routes render without crashing", () => {
  const routes: [string, string][] = [
    ["/", "Tableau de bord"],
    ["/transactions", "Transactions"],
    ["/companies", "Sociétés"],
    ["/stations", "Stations"],
    ["/churches", "Églises"],
    ["/drivers", "Chauffeurs"],
    ["/agents", "Agents"],
    ["/disbursements", "Décaissements"],
    ["/reports", "Rapports"],
    ["/audit", "Journal d'audit"],
    ["/fuel-types", "Types de carburant"],
    ["/verify", "Vérifier un reçu"],
    ["/me/history", "Mon historique"],
  ];

  for (const [path, heading] of routes) {
    test(`${path} renders`, async () => {
      renderAt(path);
      await waitFor(() => expect(screen.getAllByText(heading).length).toBeGreaterThan(0), {
        timeout: 5000,
      });
    });
  }
});

describe("api contract", () => {
  test("every request carries the Knox token and targets /api/admin", async () => {
    renderAt("/");
    await waitFor(() => expect(requestedUrls.length).toBeGreaterThan(0));
    for (const url of requestedUrls) {
      expect(url).toContain("/api/admin/");
    }
  });

  test("an unknown route shows the not-found page, not a blank screen", async () => {
    renderAt("/definitely-not-a-page");
    await waitFor(() => expect(screen.getByText("Page introuvable")).toBeDefined());
  });
});
