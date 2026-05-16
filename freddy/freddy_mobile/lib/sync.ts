/**
 * Background sync: flush offline queue to server when connected.
 */
import { getPendingTxs, markSynced } from "./db";
import { syncOfflineTransactions, TransactionPayload } from "./api";

export async function flushOfflineQueue(): Promise<{ synced: number; failed: number }> {
  const pending = await getPendingTxs();
  if (!pending.length) return { synced: 0, failed: 0 };

  const payloads: TransactionPayload[] = pending.map((tx) => ({
    sync_id: tx.sync_id,
    church: tx.church_id,
    fuel_type: tx.fuel_type_id,
    currency_used: tx.currency_used,
    amount_usd: tx.amount_usd,
    amount_cdf: tx.amount_cdf,
    notes: tx.notes,
    created_at: tx.created_at,
  }));

  const { results } = await syncOfflineTransactions(payloads);

  let synced = 0;
  let failed = 0;
  for (const r of results) {
    if (r.status === "created" || r.status === "duplicate") {
      await markSynced(r.sync_id, r.receipt_code);
      synced++;
    } else {
      failed++;
    }
  }
  return { synced, failed };
}
