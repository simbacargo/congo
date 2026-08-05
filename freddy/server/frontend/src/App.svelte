<script lang="ts">
  import { onMount } from "svelte";
  import AppShell from "./lib/components/AppShell.svelte";
  import Loading from "./lib/components/Loading.svelte";
  import { authReady, clearSession, currentUser } from "./lib/auth";
  import { hydrateAuth } from "./lib/auth";
  import { route, startRouter } from "./lib/router";
  import Login from "./pages/Login.svelte";
  import Dashboard from "./pages/Dashboard.svelte";
  import Transactions from "./pages/Transactions.svelte";
  import TransactionDetail from "./pages/TransactionDetail.svelte";
  import Directory from "./pages/Directory.svelte";
  import ResourceDetail from "./pages/ResourceDetail.svelte";
  import Agents from "./pages/Agents.svelte";
  import AgentDetail from "./pages/AgentDetail.svelte";
  import Drivers from "./pages/Drivers.svelte";
  import DriverDetail from "./pages/DriverDetail.svelte";
  import Disbursements from "./pages/Disbursements.svelte";
  import Reports from "./pages/Reports.svelte";
  import Audit from "./pages/Audit.svelte";
  import Verify from "./pages/Verify.svelte";
  import NotFound from "./pages/NotFound.svelte";

  let booted = false;

  const titles: Record<string, string> = {
    dashboard: "Dashboard", transactions: "Transactions", "transaction-detail": "Transaction detail",
    companies: "Companies", "company-detail": "Company detail", stations: "Stations", "station-detail": "Station detail",
    churches: "Churches", "church-detail": "Church detail", agents: "Agents", "agent-detail": "Agent detail",
    drivers: "Drivers", "driver-detail": "Driver detail", disbursements: "Disbursements", "fuel-types": "Fuel types",
    targets: "Station targets", reports: "Reports", audit: "Audit log", verify: "Receipt verification", "not-found": "Not found",
  };

  onMount(() => {
    const stopRouter = startRouter();
    const onUnauthorized = () => clearSession();
    window.addEventListener("freddy:unauthorized", onUnauthorized);
    hydrateAuth().finally(() => booted = true);
    return () => {
      stopRouter();
      window.removeEventListener("freddy:unauthorized", onUnauthorized);
    };
  });

  $: page = $route.name;
  $: title = titles[page] || "LCI Office";
</script>

{#if !booted || !$authReady}
  <Loading label="Loading LCI Office…" />
{:else if !$currentUser}
  <Login />
{:else}
  <AppShell {title}>
    {#if page === "dashboard"}<Dashboard />
    {:else if page === "transactions"}<Transactions />
    {:else if page === "transaction-detail"}<TransactionDetail id={$route.id!} />
    {:else if page === "companies"}<Directory resource="companies" />
    {:else if page === "company-detail"}<ResourceDetail resource="companies" id={$route.id!} />
    {:else if page === "stations"}<Directory resource="stations" />
    {:else if page === "station-detail"}<ResourceDetail resource="stations" id={$route.id!} />
    {:else if page === "churches"}<Directory resource="churches" />
    {:else if page === "church-detail"}<ResourceDetail resource="churches" id={$route.id!} />
    {:else if page === "agents"}<Agents />
    {:else if page === "agent-detail"}<AgentDetail id={$route.id!} />
    {:else if page === "drivers"}<Drivers />
    {:else if page === "driver-detail"}<DriverDetail id={$route.id!} />
    {:else if page === "disbursements"}<Disbursements />
    {:else if page === "fuel-types"}<Directory resource="fuel-types" />
    {:else if page === "targets"}<Directory resource="targets" />
    {:else if page === "reports"}<Reports />
    {:else if page === "audit"}<Audit />
    {:else if page === "verify"}<Verify />
    {:else}<NotFound />{/if}
  </AppShell>
{/if}
