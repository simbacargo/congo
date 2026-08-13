<script lang="ts">
  import { onMount } from "svelte";
  import { can } from "../lib/auth";
  import { companiesApi, stationsApi, transactionsApi } from "../lib/api";
  import { money, dateTime } from "../lib/format";
  import { navigate, routePath } from "../lib/router";
  import type { Company, Station, Transaction } from "../lib/types";
  import EmptyState from "../lib/components/EmptyState.svelte";
  import ErrorState from "../lib/components/ErrorState.svelte";
  import Loading from "../lib/components/Loading.svelte";
  import Pagination from "../lib/components/Pagination.svelte";
  import StatusBadge from "../lib/components/StatusBadge.svelte";

  let rows: Transaction[] = [];
  let companies: Company[] = [];
  let stations: Station[] = [];
  let filters = { search: "", company: "", station: "", status: "", date_from: "", date_to: "" };
  let page = 1;
  let pageSize = 25;
  let total = 0;
  let totals = { levy: 0 as string | number, count: 0 };
  let selected = new Set<string>();
  let loading = true;
  let error = "";
  let bulkAction: "verify" | "remit" = "verify";
  let busy = false;

  async function load(): Promise<void> {
    loading = true; error = "";
    try {
      const [response, companyResponse, stationResponse] = await Promise.all([
        transactionsApi.list({ ...filters, page, page_size: pageSize }),
        companiesApi.list({ page_size: 100 }), stationsApi.list({ page_size: 100 }),
      ]);
      rows = response.results; total = response.count; totals = response.totals;
      companies = companyResponse.results; stations = stationResponse.results;
      selected = new Set();
    } catch (err) { error = err instanceof Error ? err.message : "Unable to load transactions."; }
    finally { loading = false; }
  }

  function apply(): void { page = 1; load(); }
  function reset(): void { filters = { search: "", company: "", station: "", status: "", date_from: "", date_to: "" }; apply(); }
  function toggle(id: string): void { const next = new Set(selected); next.has(id) ? next.delete(id) : next.add(id); selected = next; }
  function toggleAll(): void { selected = selected.size === rows.length ? new Set() : new Set(rows.map((row) => row.id)); }
  async function runBulk(): Promise<void> {
    if (!selected.size) return;
    busy = true;
    try { await transactionsApi.bulk([...selected], bulkAction); await load(); }
    catch (err) { error = err instanceof Error ? err.message : "Bulk update failed."; }
    finally { busy = false; }
  }
  async function exportFile(kind: "excel" | "pdf"): Promise<void> {
    const blob = kind === "excel" ? await transactionsApi.exportExcel(filters) : await transactionsApi.exportPdf(filters);
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `LCI_transactions.${kind === "excel" ? "xlsx" : "pdf"}`; anchor.click(); URL.revokeObjectURL(url);
  }
  onMount(load);
</script>

<div class="page-heading"><div><h2>Transactions</h2><p>{totals.count} records · <span class="money">{money(totals.levy)}</span> total levy</p></div><div class="heading-actions"><button class="btn" on:click={() => exportFile("excel")}>⇩ Excel</button><button class="btn" on:click={() => exportFile("pdf")}>⇩ PDF</button></div></div>

<section class="card">
  <form class="filters" on:submit|preventDefault={apply}>
    <div class="filter-field search-field"><label class="field-label" for="tx-search">Search</label><input id="tx-search" bind:value={filters.search} placeholder="Receipt, church, station…" /></div>
    <div class="filter-field"><label class="field-label" for="tx-company">Company</label><select id="tx-company" bind:value={filters.company}><option value="">All companies</option>{#each companies as company}<option value={company.id}>{company.name}</option>{/each}</select></div>
    <div class="filter-field"><label class="field-label" for="tx-station">Station</label><select id="tx-station" bind:value={filters.station}><option value="">All stations</option>{#each stations as station}<option value={station.id}>{station.name}</option>{/each}</select></div>
    <div class="filter-field"><label class="field-label" for="tx-status">Status</label><select id="tx-status" bind:value={filters.status}><option value="">All statuses</option><option value="PENDING">Pending</option><option value="VERIFIED">Verified</option><option value="REMITTED">Remitted</option></select></div>
    <div class="filter-field"><label class="field-label" for="tx-from">From</label><input id="tx-from" type="date" bind:value={filters.date_from} /></div>
    <div class="filter-field"><label class="field-label" for="tx-to">To</label><input id="tx-to" type="date" bind:value={filters.date_to} /></div>
    <div class="button-group"><button class="btn btn-primary" type="submit">Apply</button><button class="btn btn-quiet" type="button" on:click={reset}>Clear</button></div>
  </form>
  {#if can("bulk_update_transactions") && rows.length}<div class="bulk-bar"><label><input type="checkbox" checked={selected.size === rows.length && rows.length > 0} on:change={toggleAll} /> Select visible</label><select class="field" bind:value={bulkAction}><option value="verify">Mark verified</option><option value="remit">Mark remitted</option></select><button class="btn btn-primary btn-small" disabled={!selected.size || busy} on:click={runBulk}>Apply ({selected.size})</button></div>{/if}
  {#if loading}<Loading />{:else if error}<ErrorState message={error} retry={load} />{:else if rows.length}<div class="table-wrap"><table class="data-table"><thead><tr>{#if can("bulk_update_transactions")}<th></th>{/if}<th>Receipt</th><th>Date</th><th>Company / Station</th><th>Agent / Fuel</th><th class="right">Amount</th><th>Status</th></tr></thead><tbody>{#each rows as tx}<tr>{#if can("bulk_update_transactions")}<td><input type="checkbox" checked={selected.has(tx.id)} on:change={() => toggle(tx.id)} /></td>{/if}<td><a class="text-link receipt-code" href={routePath("transaction-detail", tx.id)} on:click={(event) => { event.preventDefault(); navigate(routePath("transaction-detail", tx.id)); }}>{tx.receipt_code}</a></td><td class="nowrap">{dateTime(tx.created_at)}</td><td><strong>{tx.station_name}</strong><small class="subtext">{tx.company_name}</small></td><td><strong>{tx.agent_username}</strong><small class="subtext">{tx.fuel_type_name}</small></td><td class="right">{money(tx.amount_usd)}</td><td><StatusBadge status={tx.status} /></td></tr>{/each}</tbody></table></div><Pagination count={total} page={page} pageSize={pageSize} onPage={(next) => { page = next; load(); }} />{:else}<EmptyState message="No transactions match these filters." />{/if}
</section>

<style>
  .bulk-bar{display:flex;align-items:center;justify-content:flex-end;gap:10px;padding:10px 20px;border-bottom:1px solid var(--line);background:#fbfbf9;font-size:11px;color:var(--muted)}.bulk-bar label{margin-right:auto;display:flex;gap:7px;align-items:center}.bulk-bar .field{width:auto;padding:6px 8px;font-size:11px}.subtext{display:block;color:var(--muted);font-size:10px;margin-top:3px}
</style>
