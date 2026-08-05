<script lang="ts">
  import { onMount } from "svelte";
  import { can } from "../lib/auth";
  import { agentsApi, historyApi } from "../lib/api";
  import { dateTime, humanRole, money } from "../lib/format";
  import { navigate, routePath } from "../lib/router";
  import type { Agent, Transaction } from "../lib/types";
  import ErrorState from "../lib/components/ErrorState.svelte";
  import Loading from "../lib/components/Loading.svelte";
  import StatusBadge from "../lib/components/StatusBadge.svelte";

  export let id: string;
  let agent: Agent | null = null; let transactions: Transaction[] = []; let summary: any = null; let loading = true; let error = "";
  async function load(): Promise<void> { loading = true; error = ""; try { const [profile, history] = await Promise.all([agentsApi.get(id), historyApi.agent(id)]); agent = profile; transactions = (history.results as Transaction[]) || []; summary = history.summary; } catch (err) { error = err instanceof Error ? err.message : "Unable to load agent history."; } finally { loading = false; } }
  onMount(load);
</script>

{#if loading}<Loading />{:else if error}<ErrorState message={error} retry={load} />{:else if agent}
  <div class="page-heading"><div><h2>{agent.username}</h2><p>{humanRole(agent.role)} · {agent.assigned_station_name || agent.managed_company_name || "Unassigned"}</p></div><div class="heading-actions"><button class="btn" on:click={() => navigate(routePath("agents"))}>← Back</button>{#if can("manage_agents")}<button class="btn btn-primary" on:click={() => navigate(routePath("agents"))}>Edit in agents</button>{/if}</div></div>
  <div class="kpi-grid"><div class="kpi-card"><p class="kpi-label">Transactions</p><p class="kpi-value">{summary?.count || 0}</p></div><div class="kpi-card tone-success"><p class="kpi-label">Total levy</p><p class="kpi-value money">{money(summary?.total_levy_usd)}</p></div><div class="kpi-card"><p class="kpi-label">First activity</p><p class="kpi-value" style="font-size:15px">{dateTime(summary?.first_at)}</p></div><div class="kpi-card"><p class="kpi-label">Last activity</p><p class="kpi-value" style="font-size:15px">{dateTime(summary?.last_at)}</p></div></div>
  <section class="card card-pad"><div class="detail-grid"><div class="detail-item"><label>Username</label><p>{agent.username}</p></div><div class="detail-item"><label>Name</label><p>{[agent.firstname, agent.lastname].filter(Boolean).join(" ") || "—"}</p></div><div class="detail-item"><label>Email</label><p>{agent.email || "—"}</p></div><div class="detail-item"><label>Mobile</label><p>{agent.mobile || "—"}</p></div><div class="detail-item"><label>Role</label><p>{humanRole(agent.role)}</p></div><div class="detail-item"><label>Joined</label><p>{dateTime(agent.date_joined)}</p></div></div></section>
  <section class="card" style="margin-top:16px"><div class="card-header"><div><h3>Transaction history</h3><p>History returned by the scoped API</p></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Receipt</th><th>Station</th><th>Church</th><th>Levy</th><th>Status</th><th>Date</th></tr></thead><tbody>{#each transactions as tx}<tr><td><a class="text-link receipt-code" href={routePath("transaction-detail", tx.id)} on:click={(event) => { event.preventDefault(); navigate(routePath("transaction-detail", tx.id)); }}>{tx.receipt_code}</a></td><td>{tx.station_name}</td><td>{tx.church_name}</td><td class="money">{money(tx.levy_amount_usd)}</td><td><StatusBadge status={tx.status} /></td><td class="muted nowrap">{dateTime(tx.created_at)}</td></tr>{:else}<tr><td colspan="6"><div class="empty-state">No transactions in scope.</div></td></tr>{/each}</tbody></table></div></section>
{:else}<div class="empty-state">Agent not found.</div>{/if}
