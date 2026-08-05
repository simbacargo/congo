<script lang="ts">
  import { onMount } from "svelte";
  import { reportsApi } from "../lib/api";
  import { money, numberValue } from "../lib/format";
  import BarChart from "../lib/components/BarChart.svelte";
  import ErrorState from "../lib/components/ErrorState.svelte";
  import Loading from "../lib/components/Loading.svelte";

  let data: any = null; let loading = true; let error = "";
  async function load(): Promise<void> { loading = true; error = ""; try { data = await reportsApi.get(); } catch (err) { error = err instanceof Error ? err.message : "Unable to load reports."; } finally { loading = false; } }
  onMount(load);
  $: monthly = (data?.monthly || []).map((row: any) => ({ label: row.label, value: numberValue(row.levy) }));
  $: fuel = (data?.fuel_summary || []).map((row: any) => ({ label: row.fuel_type__name || "—", value: numberValue(row.total) }));
</script>

<div class="page-heading"><div><h2>Reports</h2><p>Scoped levy performance for the last twelve months.</p></div><button class="btn" on:click={load}>↻ Refresh</button></div>
{#if loading}<Loading />{:else if error}<ErrorState message={error} retry={load} />{:else if data}<div class="kpi-grid"><div class="kpi-card"><p class="kpi-label">Total levy</p><p class="kpi-value money">{money(data.stats?.total_levy)}</p></div><div class="kpi-card"><p class="kpi-label">Transactions</p><p class="kpi-value">{data.stats?.total_count || 0}</p></div><div class="kpi-card tone-warning"><p class="kpi-label">Pending</p><p class="kpi-value">{data.stats?.pending_count || 0}</p></div><div class="kpi-card tone-success"><p class="kpi-label">Disbursed</p><p class="kpi-value money">{money(data.stats?.total_disbursed)}</p></div></div><div class="grid grid-2"><section class="card card-pad"><h3 class="section-title">Monthly levy</h3><BarChart items={monthly} /></section><section class="card card-pad"><h3 class="section-title">By fuel type</h3><BarChart items={fuel} color="#15803d" /></section></div><section class="card" style="margin-top:16px"><div class="card-header"><div><h3>Church summary</h3><p>Highest levy contribution in the current scope</p></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Church</th><th>Station</th><th>Company</th><th>Transactions</th><th>Levy</th></tr></thead><tbody>{#each data.church_summary || [] as row}<tr><td>{row.church__name}</td><td>{row.church__station__name}</td><td>{row.church__station__company__name}</td><td>{row.tx_count}</td><td class="money">{money(row.total_levy)}</td></tr>{:else}<tr><td colspan="5"><div class="empty-state">No report data.</div></td></tr>{/each}</tbody></table></div></section>{/if}
