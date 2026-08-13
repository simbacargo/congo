import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";

const _platformDefault =
  Platform.OS === "android" ? "http://10.0.2.2:8000" : "https://kdcharite.com/";

export const API_BASE: string =
  (Constants.expoConfig?.extra?.apiBase as string | undefined) ?? _platformDefault;

export interface AuthToken {
  token: string;
  expiry: string;
}

export interface FuelType {
  id: string;
  name: string;
  code: string;
}

export interface Church {
  id: string;
  name: string;
  station: string;
  station_name: string;
  company_name: string;
}

export interface TransactionPayload {
  church: string;
  fuel_type: string;
  currency_used: "USD" | "CDF";
  amount_usd: string;
  amount_cdf: string;
  notes?: string;
  driver_phone?: string;
  sync_id: string;
  created_at?: string;
}

export interface TransactionResult {
  receipt_code: string;
  levy_amount_usd: string;
  levy_amount_cdf: string;
  church_name: string;
  station_name: string;
  company_name: string;
  status: string;
}

export interface AgentProfile {
  username: string;
  email: string;
  role: string;
  assigned_station?: string;
  managed_company?: string;
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const token = await AsyncStorage.getItem("auth_token");
  return token ? { Authorization: `Token ${token}` } : {};
}

const REQUEST_TIMEOUT_MS = 15000;

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const authHeader = await getAuthHeader();

  // Abort the request if the server never responds (e.g. wrong apiBase or the
  // phone isn't on the same network) so callers fail fast instead of spinning
  // forever.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let resp: Response;
  try {
    resp = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...authHeader,
        ...(options.headers as Record<string, string>),
      },
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`Couldn't reach the server at ${API_BASE}. Check the connection.`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  if (!resp.ok) {
    if (resp.status === 401) {
      await AsyncStorage.multiRemove([
        "auth_token",
        "auth_token_expiry",
        "agent_username",
        "agent_profile",
      ]);
      throw new Error("Session expired. Please log in again.");
    }
    const text = await resp.text();
    let message = text;
    try {
      const json = JSON.parse(text);
      if (json.detail) {
        message = json.detail;
      } else {
        message = Object.entries(json)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
          .join("; ");
      }
    } catch {}
    throw new Error(message);
  }

  return resp.json();
}

export async function login(username: string, password: string): Promise<AuthToken> {
  const data = await apiFetch<AuthToken>("/api/auth/login/", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  await AsyncStorage.setItem("auth_token", data.token);
  await AsyncStorage.setItem("auth_token_expiry", data.expiry);
  await AsyncStorage.setItem("agent_username", username);
  return data;
}

export async function logout() {
  try {
    await apiFetch("/api/auth/logout/", { method: "POST" });
  } catch {}
  await AsyncStorage.multiRemove([
    "auth_token",
    "auth_token_expiry",
    "agent_username",
    "agent_profile",
  ]);
}

export async function isSessionExpired(): Promise<boolean> {
  const expiry = await AsyncStorage.getItem("auth_token_expiry");
  if (!expiry) return false;
  return new Date(expiry) <= new Date();
}

export async function clearExpiredSession(): Promise<boolean> {
  const expired = await isSessionExpired();
  if (expired) {
    await AsyncStorage.multiRemove([
      "auth_token",
      "auth_token_expiry",
      "agent_username",
      "agent_profile",
    ]);
    return true;
  }
  return false;
}

export async function validateSession(): Promise<boolean> {
  const token = await AsyncStorage.getItem("auth_token");
  if (!token) return false;

  const wasCleared = await clearExpiredSession();
  if (wasCleared) return false;

  return true;
}

export async function fetchCurrencyRate(): Promise<number> {
  try {
    const data = await apiFetch<{ usd_to_cdf: string }>("/api/currency/");
    const rate = parseFloat(data.usd_to_cdf);
    await AsyncStorage.setItem("cached_rate", String(rate));
    return rate;
  } catch {
    const cached = await AsyncStorage.getItem("cached_rate");
    if (cached) return parseFloat(cached);
    return 2800;
  }
}

export async function fetchFuelTypes(): Promise<FuelType[]> {
  try {
    const data = await apiFetch<FuelType[]>("/api/fuel-types/");
    await AsyncStorage.setItem("cache_fuel_types", JSON.stringify(data));
    return data;
  } catch {
    const cached = await AsyncStorage.getItem("cache_fuel_types");
    if (cached) return JSON.parse(cached);
    return [];
  }
}

export async function fetchChurches(stationId?: string): Promise<Church[]> {
  const cacheKey = stationId ? `cache_churches_${stationId}` : "cache_churches";
  try {
    const query = stationId ? `?station=${stationId}` : "";
    const data = await apiFetch<Church[]>(`/api/churches/${query}`);
    await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
    return data;
  } catch {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
    return [];
  }
}

export async function postTransaction(payload: TransactionPayload): Promise<TransactionResult> {
  return apiFetch("/api/transactions/create/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function syncOfflineTransactions(transactions: TransactionPayload[]): Promise<{
  results: Array<{
    sync_id: string;
    status: string;
    receipt_code?: string;
    levy_amount_usd?: string;
  }>;
}> {
  return apiFetch("/api/transactions/sync/", {
    method: "POST",
    body: JSON.stringify({ transactions }),
  });
}

export async function verifyReceipt(receiptCode: string) {
  return apiFetch(`/api/verify/${receiptCode}/`);
}

export interface DriverInfo {
  id: string;
  full_name: string | null;
  phone: string | null;
  gender: string | null;
  commune: string | null;
  quartier: string | null;
  vehicle_type: string | null;
  vehicle_color: string | null;
  fuel_type: string | null;
}

export interface DriverTransaction {
  id: string;
  receipt_code: string;
  church_name: string;
  station_name: string;
  fuel_type_name: string;
  currency_used: "USD" | "CDF";
  amount_usd: string;
  levy_amount_usd: string;
  status: string;
  created_at: string;
}

export interface DriverLookup {
  driver: DriverInfo;
  transactions: DriverTransaction[];
  summary: {
    count: number;
    total_levy_usd: string;
    total_amount_usd: string;
  };
}

/**
 * Extract a driver UUID from a scanned QR code. The driver ID card encodes
 * the absolute driver-detail URL (e.g. ".../drivers/<uuid>/"), but we also
 * accept a bare UUID in case the QR payload changes.
 */
export function parseDriverId(scanned: string): string | null {
  const fromUrl = scanned.match(/drivers\/([0-9a-fA-F-]{36})/);
  if (fromUrl) return fromUrl[1];
  const bare = scanned.trim().match(/^[0-9a-fA-F-]{36}$/);
  return bare ? bare[0] : null;
}

export async function fetchDriver(id: string): Promise<DriverLookup> {
  return apiFetch(`/api/drivers/${id}/`);
}

export async function fetchProfile(): Promise<AgentProfile | null> {
  try {
    const profile = await apiFetch<AgentProfile>("/api/auth/profile/");
    await AsyncStorage.setItem("agent_profile", JSON.stringify(profile));
    return profile;
  } catch {
    const cached = await AsyncStorage.getItem("agent_profile");
    return cached ? JSON.parse(cached) : null;
  }
}
