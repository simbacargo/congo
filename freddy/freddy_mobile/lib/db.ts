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
  // Migrations – ignore errors if column already exists
  try { await _db.execAsync("ALTER TABLE queued_transactions ADD COLUMN receipt_code TEXT"); } catch {}
  try { await _db.execAsync("ALTER TABLE queued_transactions ADD COLUMN station_name TEXT"); } catch {}
  try { await _db.execAsync("ALTER TABLE queued_transactions ADD COLUMN company_name TEXT"); } catch {}
  try { await _db.execAsync("ALTER TABLE queued_transactions ADD COLUMN driver_phone TEXT"); } catch {}
  return _db;
}

export interface OfflineTx {
  id?: number;
  sync_id: string;
  church_id: string;
  church_name: string;
  station_name?: string;
  company_name?: string;
  fuel_type_id: string;
  fuel_type_name: string;
  currency_used: "USD" | "CDF";
  amount_usd: string;
  amount_cdf: string;
  levy_preview: string;
  notes?: string;
  driver_phone?: string;
  created_at: string;
  synced: 0 | 1;
  receipt_code?: string;
}

export interface LocalStats {
  totalCount: number;
  todayCount: number;
  monthCount: number;
  pendingCount: number;
  syncedCount: number;
  totalLevyUsd: number;
  todayLevyUsd: number;
  monthLevyUsd: number;
  topChurches: Array<{ church_name: string; count: number; levy: number }>;
  byFuelType: Array<{ fuel_type_name: string; count: number; levy: number }>;
}

export async function saveOfflineTx(
  tx: Omit<OfflineTx, "id">,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR IGNORE INTO queued_transactions
       (sync_id, church_id, church_name, station_name, company_name,
        fuel_type_id, fuel_type_name, currency_used, amount_usd, amount_cdf,
        levy_preview, notes, driver_phone, created_at, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      tx.sync_id,
      tx.church_id,
      tx.church_name,
      tx.station_name ?? null,
      tx.company_name ?? null,
      tx.fuel_type_id,
      tx.fuel_type_name,
      tx.currency_used,
      tx.amount_usd,
      tx.amount_cdf,
      tx.levy_preview,
      tx.notes ?? null,
      tx.driver_phone ?? null,
      tx.created_at,
    ],
  );
}

export async function getPendingTxs(): Promise<OfflineTx[]> {
  const db = await getDb();
  return db.getAllAsync<OfflineTx>(
    "SELECT * FROM queued_transactions WHERE synced = 0 ORDER BY created_at ASC",
  );
}

export async function markSynced(sync_id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "UPDATE queued_transactions SET synced = 1 WHERE sync_id = ?",
    [sync_id],
  );
}

export async function updateAfterSync(
  sync_id: string,
  receipt_code: string,
  levy_usd: string,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "UPDATE queued_transactions SET synced = 1, receipt_code = ?, levy_preview = ? WHERE sync_id = ?",
    [receipt_code, levy_usd, sync_id],
  );
}

export async function getRecentTxs(limit = 20): Promise<OfflineTx[]> {
  const db = await getDb();
  return db.getAllAsync<OfflineTx>(
    "SELECT * FROM queued_transactions ORDER BY created_at DESC LIMIT ?",
    [limit],
  );
}

export async function getTxBySyncId(sync_id: string): Promise<OfflineTx | null> {
  const db = await getDb();
  const rows = await db.getAllAsync<OfflineTx>(
    "SELECT * FROM queued_transactions WHERE sync_id = ? LIMIT 1",
    [sync_id],
  );
  return rows[0] ?? null;
}

export async function getLocalStats(): Promise<LocalStats> {
  const db = await getDb();

  const [total] = await db.getAllAsync<{ c: number }>(
    "SELECT COUNT(*) as c FROM queued_transactions",
  );
  const [today] = await db.getAllAsync<{ c: number }>(
    "SELECT COUNT(*) as c FROM queued_transactions WHERE DATE(created_at) = DATE('now','localtime')",
  );
  const [month] = await db.getAllAsync<{ c: number }>(
    "SELECT COUNT(*) as c FROM queued_transactions WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now','localtime')",
  );
  const [pending] = await db.getAllAsync<{ c: number }>(
    "SELECT COUNT(*) as c FROM queued_transactions WHERE synced = 0",
  );
  const [synced] = await db.getAllAsync<{ c: number }>(
    "SELECT COUNT(*) as c FROM queued_transactions WHERE synced = 1",
  );
  const [levyTotal] = await db.getAllAsync<{ s: number }>(
    "SELECT COALESCE(SUM(CAST(levy_preview AS REAL)), 0) as s FROM queued_transactions",
  );
  const [levyToday] = await db.getAllAsync<{ s: number }>(
    "SELECT COALESCE(SUM(CAST(levy_preview AS REAL)), 0) as s FROM queued_transactions WHERE DATE(created_at) = DATE('now','localtime')",
  );
  const [levyMonth] = await db.getAllAsync<{ s: number }>(
    "SELECT COALESCE(SUM(CAST(levy_preview AS REAL)), 0) as s FROM queued_transactions WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now','localtime')",
  );
  const topChurches = await db.getAllAsync<{ church_name: string; count: number; levy: number }>(
    `SELECT church_name, COUNT(*) as count, COALESCE(SUM(CAST(levy_preview AS REAL)), 0) as levy
     FROM queued_transactions GROUP BY church_name ORDER BY count DESC LIMIT 5`,
  );
  const byFuelType = await db.getAllAsync<{ fuel_type_name: string; count: number; levy: number }>(
    `SELECT fuel_type_name, COUNT(*) as count, COALESCE(SUM(CAST(levy_preview AS REAL)), 0) as levy
     FROM queued_transactions GROUP BY fuel_type_name ORDER BY count DESC`,
  );

  return {
    totalCount: total?.c ?? 0,
    todayCount: today?.c ?? 0,
    monthCount: month?.c ?? 0,
    pendingCount: pending?.c ?? 0,
    syncedCount: synced?.c ?? 0,
    totalLevyUsd: levyTotal?.s ?? 0,
    todayLevyUsd: levyToday?.s ?? 0,
    monthLevyUsd: levyMonth?.s ?? 0,
    topChurches,
    byFuelType,
  };
}
