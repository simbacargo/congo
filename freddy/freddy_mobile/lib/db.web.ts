/**
 * Web fallback for the offline SQLite layer.
 * expo-sqlite has no web support on SDK 51, so on web the queue is kept in
 * AsyncStorage (localStorage) under a single key. Same public API as db.ts.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { LocalStats, OfflineTx } from "./db";

export type { LocalStats, OfflineTx } from "./db";

const STORE_KEY = "lci_offline_txs";

async function readAll(): Promise<OfflineTx[]> {
  const raw = await AsyncStorage.getItem(STORE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as OfflineTx[];
  } catch {
    return [];
  }
}

async function writeAll(rows: OfflineTx[]): Promise<void> {
  await AsyncStorage.setItem(STORE_KEY, JSON.stringify(rows));
}

export async function saveOfflineTx(tx: Omit<OfflineTx, "id">): Promise<void> {
  const rows = await readAll();
  if (rows.some((r) => r.sync_id === tx.sync_id)) return; // INSERT OR IGNORE
  const nextId = rows.reduce((m, r) => Math.max(m, r.id ?? 0), 0) + 1;
  rows.push({ ...tx, id: nextId, synced: 0 });
  await writeAll(rows);
}

export async function getPendingTxs(): Promise<OfflineTx[]> {
  const rows = await readAll();
  return rows
    .filter((r) => r.synced === 0)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export async function markSynced(sync_id: string): Promise<void> {
  const rows = await readAll();
  for (const r of rows) if (r.sync_id === sync_id) r.synced = 1;
  await writeAll(rows);
}

export async function updateAfterSync(
  sync_id: string,
  receipt_code: string,
  levy_usd: string,
): Promise<void> {
  const rows = await readAll();
  for (const r of rows) {
    if (r.sync_id === sync_id) {
      r.synced = 1;
      r.receipt_code = receipt_code;
      r.levy_preview = levy_usd;
    }
  }
  await writeAll(rows);
}

export async function getRecentTxs(limit = 20): Promise<OfflineTx[]> {
  const rows = await readAll();
  return rows
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit);
}

export async function getTxBySyncId(sync_id: string): Promise<OfflineTx | null> {
  const rows = await readAll();
  return rows.find((r) => r.sync_id === sync_id) ?? null;
}

export async function getLocalStats(): Promise<LocalStats> {
  const rows = await readAll();
  const now = new Date();
  const isToday = (r: OfflineTx) => {
    const d = new Date(r.created_at);
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  };
  const isThisMonth = (r: OfflineTx) => {
    const d = new Date(r.created_at);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  };
  const levy = (r: OfflineTx) => parseFloat(r.levy_preview) || 0;
  const sum = (list: OfflineTx[]) => list.reduce((s, r) => s + levy(r), 0);

  const groupBy = (key: "church_name" | "fuel_type_name") => {
    const map = new Map<string, { count: number; levy: number }>();
    for (const r of rows) {
      const k = r[key] ?? "";
      const g = map.get(k) ?? { count: 0, levy: 0 };
      g.count += 1;
      g.levy += levy(r);
      map.set(k, g);
    }
    return [...map.entries()]
      .map(([name, g]) => ({ name, ...g }))
      .sort((a, b) => b.count - a.count);
  };

  const todayRows = rows.filter(isToday);
  const monthRows = rows.filter(isThisMonth);

  return {
    totalCount: rows.length,
    todayCount: todayRows.length,
    monthCount: monthRows.length,
    pendingCount: rows.filter((r) => r.synced === 0).length,
    syncedCount: rows.filter((r) => r.synced === 1).length,
    totalLevyUsd: sum(rows),
    todayLevyUsd: sum(todayRows),
    monthLevyUsd: sum(monthRows),
    topChurches: groupBy("church_name")
      .slice(0, 5)
      .map(({ name, count, levy }) => ({ church_name: name, count, levy })),
    byFuelType: groupBy("fuel_type_name").map(({ name, count, levy }) => ({
      fuel_type_name: name,
      count,
      levy,
    })),
  };
}
