<script lang="ts">
  import { onMount } from "svelte";
  import { dashboardApi } from "../lib/api";
  import { money, numberValue, shortMoney, dateTime } from "../lib/format";
  import { navigate, routePath } from "../lib/router";
  import type { DashboardStats } from "../lib/types";
  import BarChart from "../lib/components/BarChart.svelte";
  import DonutChart from "../lib/components/DonutChart.svelte";
  import ErrorState from "../lib/components/ErrorState.svelte";
  import LineChart from "../lib/components/LineChart.svelte";
  import Loading from "../lib/components/Loading.svelte";
  import StatCard from "../lib/components/StatCard.svelte";
  import StatusBadge from "../lib/components/StatusBadge.svelte";

  let stats: DashboardStats | null = null;
  let trend: Array<{ label: string; value: number }> = [];
  let days = 30;
  let loading = true;
  let error = "";

  async function load(): Promise<void> {
    loading = true;
    error = "";
    try {
      const [dashboard, chart] = await Promise.all([dashboardApi.stats(), dashboardApi.chart(days)]);
      stats = dashboard;
      trend = chart.data.map((point) => ({ label: point.date, value: numberValue(point.amount) }));
    } catch (err) {
      error = err instanceof Error ? err.message : "Unable to load dashboard.";
    } finally { loading = false; }
  }

  onMount(load);

  $: companyBars = stats?.by_company.map((row) => ({ label: String(row["station__company__name"] || "—"), value: numberValue(row.total) })) || [];
  $: fuelBars = stats?.by_fuel.map((row) => ({ label: String(row["fuel_type__name"] || "—"), value: numberValue(row.total) })) || [];
</script>

<div class="page-heading"><div><h2>Dashboard</h2><p>Live overview of collection, verification, and disbursement activity.</p></div><div class="heading-actions"><button class:active={days === 7} class="btn btn-quiet" on:click={() => { days = 7; load(); }}>7 days</button><button class:active={days === 30} class="btn btn-quiet" on:click={() => { days = 30; load(); }}>30 days</button><button class:active={days === 90} class="btn btn-quiet" on:click={() => { days = 90; load(); }}>90 days</button><button class="btn" on:click={load}>↻ Refresh</button></div></div>

{#if loading}<Loading />
{:else if error}<ErrorState message={error} retry={load} />
{:else if stats}
  <div class="kpi-grid">
    <StatCard label="Today’s levy" value={money(stats.today_levy)} hint={`${stats.today_count} transactions`} tone="accent" />
    <StatCard label="This month" value={money(stats.month_levy)} hint={`${stats.month_count} transactions`} tone="success" />
    <StatCard label="Total levy" value={money(stats.total_levy)} hint={`${stats.total_count} records`} />
    <StatCard label="Pending" value={stats.pending_count} hint={`${stats.verified_count} verified · ${stats.remitted_count} remitted`} tone="warning" />
  </div>

  <div class="grid grid-wide">
    <section class="card card-pad"><div class="split"><div><h3 class="section-title">Levy trend</h3><p class="section-subtitle">Collected levy in USD</p></div><span class="status status-verified">{days} days</span></div><LineChart points={trend} /></section>
    <section class="card card-pad"><div><h3 class="section-title">Transaction status</h3><p class="section-subtitle">Current distribution</p></div><DonutChart values={[stats.pending_count, stats.verified_count, stats.remitted_count]} labels={["Pending", "Verified", "Remitted"]} /></section>
  </div>

  <div class="grid grid-2" style="margin-top:16px">
    <section class="card card-pad"><h3 class="section-title">Levy by company</h3><p class="section-subtitle">Scoped to your account</p><BarChart items={companyBars} /></section>
    <section class="card card-pad"><h3 class="section-title">Levy by fuel type</h3><p class="section-subtitle">Contribution by fuel</p><BarChart items={fuelBars} color="#15803d" /></section>
  </div>

  <section class="card card-pad" style="margin-top:16px"><div class="split"><div><h3 class="section-title">Top stations this month</h3><p class="section-subtitle">Progress against monthly targets</p></div><span class="muted" style="font-size:11px">Paid out: {money(stats.total_disbursed)}</span></div>
    <div class="grid grid-3" style="margin-top:16px">
      {#each stats.top_stations as station}
        <button class="station-card" on:click={() => navigate(routePath("station-detail", station.id))}><div class="split"><strong>{station.name}</strong><span class="money">{money(station.month_levy)}</span></div><p>{station.company_name}</p>{#if station.target_pct !== null}<div class="progress"><span style={`width:${station.target_pct}%`}></span></div><small>{station.target_pct}% of {money(station.target_usd)}</small>{:else}<small>No target set</small>{/if}</button>
      {:else}<div class="empty-state">No active stations yet.</div>{/each}
    </div>
  </section>

  <section class="card" style="margin-top:16px"><div class="card-header"><div><h3>Recent transactions</h3><p>Latest activity in your scope</p></div><a class="btn btn-quiet" href={routePath("transactions")} on:click={(event) => { event.preventDefault(); navigate(routePath("transactions")); }}>View all →</a></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Receipt</th><th>Station</th><th>Church</th><th>Levy</th><th>Status</th><th>Date</th></tr></thead><tbody>{#each stats.recent as tx}<tr><td><a class="text-link receipt-code" href={routePath("transaction-detail", tx.id)} on:click={(event) => { event.preventDefault(); navigate(routePath("transaction-detail", tx.id)); }}>{tx.receipt_code}</a></td><td>{tx.station_name}</td><td>{tx.church_name}</td><td class="money">{money(tx.levy_amount_usd)}</td><td><StatusBadge status={tx.status} /></td><td class="muted nowrap">{dateTime(tx.created_at)}</td></tr>{:else}<tr><td colspan="6"><div class="empty-state">No transactions yet.</div></td></tr>{/each}</tbody></table></div></section>
{:else}<div class="empty-state">No dashboard data.</div>{/if}

<style>
  .heading-actions .active{background:var(--accent-soft);color:var(--accent);border-color:#b9c8d8}
  .station-card{border:1px solid var(--line);background:var(--surface);border-radius:9px;padding:14px;text-align:left;transition:.15s}
  .station-card:hover{border-color:#b9c8d8;box-shadow:0 3px 10px rgb(28 33 38 / .06)}
  .station-card strong{font-size:13px}.station-card .money{font-size:12px}.station-card p{font-size:11px;color:var(--muted);margin:5px 0 13px}.station-card small{display:block;color:var(--muted);font-size:10px;margin-top:6px}
</style>
