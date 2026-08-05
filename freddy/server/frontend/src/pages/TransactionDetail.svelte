<script lang="ts">
  import { onMount } from "svelte";
  import { can } from "../lib/auth";
  import { transactionsApi } from "../lib/api";
  import { dateTime, money } from "../lib/format";
  import { navigate, routePath } from "../lib/router";
  import type { AuditLog, Transaction } from "../lib/types";
  import ErrorState from "../lib/components/ErrorState.svelte";
  import Loading from "../lib/components/Loading.svelte";
  import StatusBadge from "../lib/components/StatusBadge.svelte";

  export let id: string;
  let tx: (Transaction & { audit_logs: AuditLog[] }) | null = null;
  let status = ""; let notes = ""; let loading = true; let busy = false; let error = ""; let saved = "";

  async function load(): Promise<void> { loading = true; error = ""; try { tx = await transactionsApi.get(id); status = tx.status; notes = tx.notes || ""; } catch (err) { error = err instanceof Error ? err.message : "Unable to load transaction."; } finally { loading = false; } }
  async function save(): Promise<void> { busy = true; saved = ""; error = ""; try { tx = await transactionsApi.update(id, { status, notes }); saved = "Transaction updated."; } catch (err) { error = err instanceof Error ? err.message : "Unable to update transaction."; } finally { busy = false; } }
  onMount(load);
</script>

{#if loading}<Loading />{:else if error && !tx}<ErrorState message={error} retry={load} />{:else if tx}
  <div class="page-heading"><div><h2>Transaction detail</h2><p class="receipt-code">{tx.receipt_code}</p></div><button class="btn" on:click={() => navigate(routePath("transactions"))}>← Back</button></div>
  {#if error}<div class="alert alert-error">{error}</div>{/if}{#if saved}<div class="alert alert-success">{saved}</div>{/if}
  <div class="grid grid-wide"><div class="stack"><section class="card card-pad"><div class="split"><div><p class="kpi-label">Receipt code</p><h3 class="receipt-code" style="font-size:20px;color:var(--accent);margin:5px 0 0">{tx.receipt_code}</h3></div><StatusBadge status={tx.status} /></div><div class="detail-grid" style="margin-top:24px"><div class="detail-item"><label>Company</label><p>{tx.company_name}</p></div><div class="detail-item"><label>Station</label><p>{tx.station_name}</p></div><div class="detail-item"><label>Church</label><p>{tx.church_name}</p></div><div class="detail-item"><label>Agent</label><p>{tx.agent_username}</p></div><div class="detail-item"><label>Fuel type</label><p>{tx.fuel_type_name}</p></div><div class="detail-item"><label>Currency</label><p>{tx.currency_used}</p></div><div class="detail-item"><label>Amount USD</label><p>{money(tx.amount_usd)}</p></div><div class="detail-item"><label>Amount CDF</label><p>{money(tx.amount_cdf, "CDF")}</p></div><div class="detail-item"><label>Exchange rate</label><p>{tx.exchange_rate}</p></div><div class="detail-item"><label>Driver phone</label><p>{tx.driver_phone || "—"}</p></div><div class="detail-item"><label>Created</label><p>{dateTime(tx.created_at)}</p></div><div class="detail-item"><label>Sync ID</label><p class="receipt-code">{tx.sync_id || "—"}</p></div></div><div class="detail-section levy-highlight"><div><span>2% charity levy</span><strong>{money(tx.levy_amount_usd)}</strong></div><div><span>CDF equivalent</span><strong>{money(tx.levy_amount_cdf, "CDF")}</strong></div></div>{#if tx.notes}<div class="detail-section"><h3>Notes</h3><p>{tx.notes}</p></div>{/if}</section><section class="card"><div class="card-header"><div><h3>Audit trail</h3><p>Recorded changes to this transaction</p></div></div>{#if tx.audit_logs?.length}<div class="audit-list">{#each tx.audit_logs as log}<div class="audit-row"><div><strong>{log.field_name}</strong><p>{log.old_value || "—"} → {log.new_value || "—"}</p></div><div class="muted text-right"><span>{log.changed_by_username || "System"}</span><small>{dateTime(log.changed_at)}</small></div></div>{/each}</div>{:else}<div class="empty-state">No changes recorded.</div>{/if}</section></div><aside>{#if can("update_transaction_status")}<section class="card card-pad"><h3 class="section-title">Update status</h3><p class="section-subtitle">Only NGO admins can update transaction status.</p><form on:submit|preventDefault={save} style="margin-top:18px"><div class="form-field"><label class="field-label" for="tx-detail-status">Status</label><select id="tx-detail-status" class="field" bind:value={status}><option value="PENDING">Pending</option><option value="VERIFIED">Verified</option><option value="REMITTED">Remitted</option></select></div><div class="form-field" style="margin-top:14px"><label class="field-label" for="tx-detail-notes">Notes</label><textarea id="tx-detail-notes" class="field" bind:value={notes} rows="4"></textarea></div><button class="btn btn-primary" style="width:100%;margin-top:14px" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button></form></section>{/if}</aside></div>
{:else}<div class="empty-state">Transaction not found.</div>{/if}

<style>
  .levy-highlight{display:flex;justify-content:space-between;gap:20px;background:var(--ok-soft);border-radius:9px;padding:15px}.levy-highlight span,.levy-highlight strong{display:block}.levy-highlight span{font-size:10px;color:var(--ok);font-weight:600}.levy-highlight strong{font:600 20px "IBM Plex Mono",monospace;color:var(--money);margin-top:4px}.audit-list{padding:0 20px}.audit-row{display:flex;justify-content:space-between;gap:15px;padding:14px 0;border-bottom:1px solid var(--line);font-size:12px}.audit-row:last-child{border-bottom:0}.audit-row p{margin:5px 0 0;color:var(--muted)}.audit-row small,.audit-row span{display:block;font-size:10px;margin-top:4px}
</style>
