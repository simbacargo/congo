<script lang="ts">
  import { onMount } from "svelte";
  import { auditApi } from "../lib/api";
  import { dateTime } from "../lib/format";
  import EmptyState from "../lib/components/EmptyState.svelte";
  import ErrorState from "../lib/components/ErrorState.svelte";
  import Loading from "../lib/components/Loading.svelte";
  import Pagination from "../lib/components/Pagination.svelte";
  let rows: any[] = []; let total = 0; let page = 1; let loading = true; let error = ""; let filters = { q: "", field: "", user: "", from: "", to: "" };
  async function load(): Promise<void> { loading = true; error = ""; try { const response = await auditApi.list({ ...filters, page, page_size: 50 }); rows = response.results; total = response.count; } catch (err) { error = err instanceof Error ? err.message : "Unable to load audit log."; } finally { loading = false; } }
  function apply(): void { page = 1; load(); }
  function reset(): void { filters = { q: "", field: "", user: "", from: "", to: "" }; apply(); }
  onMount(load);
</script>

<div class="page-heading"><div><h2>Audit log</h2><p>Immutable transaction change history.</p></div></div><section class="card"><form class="filters" on:submit|preventDefault={apply}><div class="filter-field search-field"><label class="field-label">Receipt</label><input bind:value={filters.q} placeholder="LCI-…" /></div><div class="filter-field"><label class="field-label">Field</label><input bind:value={filters.field} placeholder="status" /></div><div class="filter-field"><label class="field-label">Changed by</label><input bind:value={filters.user} /></div><div class="filter-field"><label class="field-label">From</label><input type="date" bind:value={filters.from} /></div><div class="filter-field"><label class="field-label">To</label><input type="date" bind:value={filters.to} /></div><div class="button-group"><button class="btn btn-primary">Apply</button><button class="btn btn-quiet" type="button" on:click={reset}>Clear</button></div></form>{#if loading}<Loading />{:else if error}<ErrorState message={error} retry={load} />{:else if rows.length}<div class="table-wrap"><table class="data-table"><thead><tr><th>Receipt</th><th>Company</th><th>Field</th><th>Change</th><th>Changed by</th><th>Date</th><th>IP</th></tr></thead><tbody>{#each rows as row}<tr><td class="receipt-code">{row.receipt_code}</td><td>{row.company_name}</td><td><strong>{row.field_name}</strong></td><td><span class="old-value">{row.old_value || "—"}</span> → <span class="new-value">{row.new_value || "—"}</span></td><td>{row.changed_by_username || "System"}</td><td class="muted nowrap">{dateTime(row.changed_at)}</td><td class="num">{row.ip_address || "—"}</td></tr>{/each}</tbody></table></div><Pagination count={total} page={page} pageSize={50} onPage={(next) => { page = next; load(); }} />{:else}<EmptyState message="No audit entries found." />{/if}</section>

<style>.old-value{color:var(--danger);text-decoration:line-through}.new-value{color:var(--ok);font-weight:600}</style>
