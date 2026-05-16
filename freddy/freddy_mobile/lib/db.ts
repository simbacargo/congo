/**
 * Offline-first SQLite layer.
 * Queued transactions survive app restarts and sync when connectivity returns.
 */
import * as SQLite from "expo-sqlite";

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync("lci_offline.db");
  await _db.execAsync(`
    CREATE TABLE IF NOT EXISTS queued_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sync_id TEXT UNIQUE NOT NULL,
      church_id TEXT NOT NULL,
      church_name TEXT NOT NULL,
      fuel_type_id TEXT NOT NULL,
      fuel_type_name TEXT NOT NULL,
      currency_used TEXT NOT NULL,
      amount_usd TEXT NOT NULL,
      amount_cdf TEXT NOT NULL,
      levy_preview TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      synced INTEGER DEFAULT 0
    );
  `);
  return _db;
}

export interface OfflineTx {
  id?: number;
  sync_id: string;
  church_id: string;
  church_name: string;
  fuel_type_id: string;
  fuel_type_name: string;
  currency_used: "USD" | "CDF";
  amount_usd: string;
  amount_cdf: string;
  levy_preview: string;
  notes?: string;
  created_at: string;
  synced: 0 | 1;
}

export async function saveOfflineTx(tx: Omit<OfflineTx, "id">): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR IGNORE INTO queued_transactions
       (sync_id, church_id, church_name, fuel_type_id, fuel_type_name,
        currency_used, amount_usd, amount_cdf, levy_preview, notes, created_at, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      tx.sync_id, tx.church_id, tx.church_name,
      tx.fuel_type_id, tx.fuel_type_name,
      tx.currency_used, tx.amount_usd, tx.amount_cdf,
      tx.levy_preview, tx.notes ?? null, tx.created_at,
    ]
  );
}

export async function getPendingTxs(): Promise<OfflineTx[]> {
  const db = await getDb();
  return db.getAllAsync<OfflineTx>(
    "SELECT * FROM queued_transactions WHERE synced = 0 ORDER BY created_at ASC"
  );
}

export async function markSynced(sync_id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync("UPDATE queued_transactions SET synced = 1 WHERE sync_id = ?", [sync_id]);
}

export async function getRecentTxs(limit = 20): Promise<OfflineTx[]> {
  const db = await getDb();
  return db.getAllAsync<OfflineTx>(
    "SELECT * FROM queued_transactions ORDER BY created_at DESC LIMIT ?",
    [limit]
  );
}
