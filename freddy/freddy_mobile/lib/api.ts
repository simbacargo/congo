import AsyncStorage from "@react-native-async-storage/async-storage";

export const API_BASE = "http://10.0.2.2:8000"; // Android emulator → localhost

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

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const authHeader = await getAuthHeader();
  const resp = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
      ...(options.headers as Record<string, string>),
    },
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(err);
  }
  return resp.json();
}

export async function login(
  username: string,
  password: string,
): Promise<AuthToken> {
  const data = await apiFetch<AuthToken>("/api/auth/login/", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  await AsyncStorage.setItem("auth_token", data.token);
  await AsyncStorage.setItem("agent_username", username);
  return data;
}

export async function logout() {
  try {
    await apiFetch("/api/auth/logout/", { method: "POST" });
  } catch {}
  await AsyncStorage.multiRemove(["auth_token", "agent_username", "agent_profile"]);
}

export async function fetchCurrencyRate(): Promise<number> {
  const data = await apiFetch<{ usd_to_cdf: string }>("/api/currency/");
  return parseFloat(data.usd_to_cdf);
}

export async function fetchFuelTypes(): Promise<FuelType[]> {
  return apiFetch("/api/fuel-types/");
}

export async function fetchChurches(stationId?: string): Promise<Church[]> {
  const query = stationId ? `?station=${stationId}` : "";
  return apiFetch(`/api/churches/${query}`);
}

export async function postTransaction(
  payload: TransactionPayload,
): Promise<TransactionResult> {
  return apiFetch("/api/transactions/create/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function syncOfflineTransactions(
  transactions: TransactionPayload[],
): Promise<{
  results: Array<{ sync_id: string; status: string; receipt_code?: string }>;
}> {
  return apiFetch("/api/transactions/sync/", {
    method: "POST",
    body: JSON.stringify({ transactions }),
  });
}

export async function verifyReceipt(receiptCode: string) {
  return apiFetch(`/api/verify/${receiptCode}/`);
}

export async function fetchProfile(): Promise<AgentProfile | null> {
  try {
    const profile = await apiFetch<AgentProfile>("/api/auth/profile/");
    await AsyncStorage.setItem("agent_profile", JSON.stringify(profile));
    return profile;
  } catch {
    // Try cached version
    const cached = await AsyncStorage.getItem("agent_profile");
    return cached ? JSON.parse(cached) : null;
  }
}
