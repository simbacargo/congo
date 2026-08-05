import type {
  Agent, AuditLog, Church, Company, DashboardStats, Disbursement, Driver,
  DriverListResponse, FuelType, LoginResponse, MeResponse, Paginated, Station,
  StationTarget, Transaction, User,
} from "./types";
import { clearToken, getToken } from "./storage";

export const API_BASE = import.meta.env.VITE_API_BASE || "/api/admin";

export class ApiError extends Error {
  status: number;
  payload: Record<string, unknown>;

  constructor(status: number, payload: Record<string, unknown> = {}) {
    super(typeof payload.detail === "string" ? payload.detail : `Request failed (${status})`);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

function makeUrl(path: string, params?: Record<string, unknown>): string {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  });
  return `${API_BASE}${path}${query.toString() ? `?${query}` : ""}`;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}, params?: Record<string, unknown>): Promise<T> {
  const headers = new Headers(init.headers || {});
  const body = init.body;
  if (body && typeof body === "object" && !(body instanceof FormData) && !(body instanceof Blob)) {
    headers.set("Content-Type", "application/json");
  }
  const token = getToken();
  if (token) headers.set("Authorization", `Token ${token}`);
  const response = await fetch(makeUrl(path, params), {
    ...init,
    headers,
    body: body && typeof body === "object" && !(body instanceof FormData) && !(body instanceof Blob)
      ? JSON.stringify(body)
      : body,
  });
  if (response.status === 401) {
    clearToken();
    window.dispatchEvent(new CustomEvent("freddy:unauthorized"));
  }
  if (!response.ok) {
    let payload: Record<string, unknown> = {};
    try { payload = await response.json(); } catch { /* empty response */ }
    throw new ApiError(response.status, payload);
  }
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return text ? JSON.parse(text) as T : undefined as T;
}

async function download(path: string, params?: Record<string, unknown>): Promise<Blob> {
  const headers = new Headers();
  const token = getToken();
  if (token) headers.set("Authorization", `Token ${token}`);
  const response = await fetch(makeUrl(path, params), { headers });
  if (!response.ok) throw new ApiError(response.status);
  return response.blob();
}

const listParams = (params: Record<string, unknown> = {}) => params;

export const authApi = {
  login: (username: string, password: string) => apiFetch<LoginResponse>("/auth/login/", { method: "POST", body: { username, password } as unknown as BodyInit }),
  me: () => apiFetch<MeResponse>("/me/"),
  logout: () => apiFetch<void>("/auth/logout/", { method: "POST" }).catch(() => undefined),
};

export const dashboardApi = {
  stats: () => apiFetch<DashboardStats>("/dashboard/stats/"),
  chart: (days = 30) => apiFetch<{ data: Array<{ date: string; amount: number }> }>("/dashboard/chart/", {}, { days }),
};

export const transactionsApi = {
  list: (params: Record<string, unknown> = {}) => apiFetch<Paginated<Transaction> & { totals: { levy: string | number; count: number } }>("/transactions/", {}, listParams(params)),
  get: (id: string) => apiFetch<Transaction & { audit_logs: AuditLog[] }>(`/transactions/${id}/`),
  update: (id: string, body: { status?: string; notes?: string }) => apiFetch<Transaction & { audit_logs: AuditLog[] }>(`/transactions/${id}/`, { method: "PATCH", body: body as unknown as BodyInit }),
  bulk: (ids: string[], action: "verify" | "remit") => apiFetch<{ updated: number }>("/transactions/bulk/", { method: "POST", body: { ids, action } as unknown as BodyInit }),
  exportExcel: (params: Record<string, unknown> = {}) => download("/transactions/export/excel/", params),
  exportPdf: (params: Record<string, unknown> = {}) => download("/transactions/export/pdf/", params),
};

export const companiesApi = {
  list: (params: Record<string, unknown> = {}) => apiFetch<Paginated<Company>>("/companies/", {}, params),
  get: (id: string) => apiFetch<Company>(`/companies/${id}/`),
  create: (body: Record<string, unknown>) => apiFetch<Company>("/companies/", { method: "POST", body: body as unknown as BodyInit }),
  update: (id: string, body: Record<string, unknown>) => apiFetch<Company>(`/companies/${id}/`, { method: "PATCH", body: body as unknown as BodyInit }),
};

export const stationsApi = {
  list: (params: Record<string, unknown> = {}) => apiFetch<Paginated<Station>>("/stations/", {}, params),
  get: (id: string) => apiFetch<Station>(`/stations/${id}/`),
  create: (body: Record<string, unknown>) => apiFetch<Station>("/stations/", { method: "POST", body: body as unknown as BodyInit }),
  update: (id: string, body: Record<string, unknown>) => apiFetch<Station>(`/stations/${id}/`, { method: "PATCH", body: body as unknown as BodyInit }),
};

export const churchesApi = {
  list: (params: Record<string, unknown> = {}) => apiFetch<Paginated<Church>>("/churches/", {}, params),
  get: (id: string) => apiFetch<Church>(`/churches/${id}/`),
  create: (body: Record<string, unknown>) => apiFetch<Church>("/churches/", { method: "POST", body: body as unknown as BodyInit }),
  update: (id: string, body: Record<string, unknown>) => apiFetch<Church>(`/churches/${id}/`, { method: "PATCH", body: body as unknown as BodyInit }),
};

export const disbursementsApi = {
  list: (params: Record<string, unknown> = {}) => apiFetch<Paginated<Disbursement> & { totals: { total: string | number; count: number } }>("/disbursements/", {}, params),
  get: (id: string) => apiFetch<Disbursement>(`/disbursements/${id}/`),
  create: (body: Record<string, unknown>) => apiFetch<Disbursement>("/disbursements/", { method: "POST", body: body as unknown as BodyInit }),
  update: (id: string, body: Record<string, unknown>) => apiFetch<Disbursement>(`/disbursements/${id}/`, { method: "PATCH", body: body as unknown as BodyInit }),
  pay: (id: string) => apiFetch<Disbursement>(`/disbursements/${id}/pay/`, { method: "POST" }),
};

export const agentsApi = {
  list: (params: Record<string, unknown> = {}) => apiFetch<Paginated<Agent>>("/agents/", {}, params),
  get: (id: string) => apiFetch<Agent>(`/agents/${id}/`),
  create: (body: Record<string, unknown>) => apiFetch<Agent>("/agents/", { method: "POST", body: body as unknown as BodyInit }),
  update: (id: string, body: Record<string, unknown>) => apiFetch<Agent>(`/agents/${id}/`, { method: "PATCH", body: body as unknown as BodyInit }),
};

export const fuelTypesApi = {
  list: () => apiFetch<FuelType[]>("/fuel-types/"),
  get: (id: string) => apiFetch<FuelType>(`/fuel-types/${id}/`),
  create: (body: Record<string, unknown>) => apiFetch<FuelType>("/fuel-types/", { method: "POST", body: body as unknown as BodyInit }),
  update: (id: string, body: Record<string, unknown>) => apiFetch<FuelType>(`/fuel-types/${id}/`, { method: "PATCH", body: body as unknown as BodyInit }),
};

export const targetsApi = {
  list: (params: Record<string, unknown> = {}) => apiFetch<Paginated<StationTarget>>("/station-targets/", {}, params),
  get: (id: number | string) => apiFetch<StationTarget>(`/station-targets/${id}/`),
  create: (body: Record<string, unknown>) => apiFetch<StationTarget>("/station-targets/", { method: "POST", body: body as unknown as BodyInit }),
  update: (id: number | string, body: Record<string, unknown>) => apiFetch<StationTarget>(`/station-targets/${id}/`, { method: "PATCH", body: body as unknown as BodyInit }),
  remove: (id: number | string) => apiFetch<void>(`/station-targets/${id}/`, { method: "DELETE" }),
};

export const driversApi = {
  list: (params: Record<string, unknown> = {}) => apiFetch<DriverListResponse>("/drivers/", {}, params),
  get: (id: string) => apiFetch<{ driver: Driver; qr_code: string; profile_url: string; transactions: Transaction[]; summary: Record<string, string | number> }>(`/drivers/${id}/`),
  idCard: (id: string) => apiFetch<Record<string, unknown>>(`/drivers/${id}/id-card/`),
  exportExcel: (params: Record<string, unknown> = {}) => download("/drivers/export/excel/", params),
};

export const historyApi = {
  agent: (id?: string, params: Record<string, unknown> = {}) => apiFetch<Record<string, unknown>>(id ? `/agents/${id}/history/` : "/agents/me/history/", {}, params),
  station: (id?: string, params: Record<string, unknown> = {}) => apiFetch<Record<string, unknown>>(id ? `/stations/${id}/history/` : "/stations/me/history/", {}, params),
};

export const reportsApi = {
  get: () => apiFetch<Record<string, unknown>>("/reports/"),
};

export const auditApi = {
  list: (params: Record<string, unknown> = {}) => apiFetch<Paginated<AuditLog>>("/audit/", {}, params),
};

export const verifyApi = {
  receipt: (code: string) => apiFetch<Record<string, unknown>>(`/verify/${encodeURIComponent(code)}/`),
};
