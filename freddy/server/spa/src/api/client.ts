/**
 * Thin fetch wrapper around the Django API.
 *
 * Auth is a Knox token in the `Authorization: Token <key>` header, matching
 * what the mobile client already sends. A 401 anywhere means the token expired
 * (Knox TTL is 24h), so we clear it and let the app fall back to the login
 * screen rather than leaving the user staring at empty tables.
 */

const TOKEN_KEY = "freddy.token";
const USER_KEY = "freddy.user";

export const API_BASE = "/api/admin";

export type Role = "NGO_ADMIN" | "COMPANY_MANAGER" | "STATION_AGENT";

export interface CurrentUser {
  id: string;
  username: string;
  email: string | null;
  firstname: string | null;
  lastname: string | null;
  role: Role;
  is_superuser: boolean;
  assigned_station: string | null;
  assigned_station_name: string | null;
  managed_company: string | null;
  managed_company_name: string | null;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): CurrentUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CurrentUser;
  } catch {
    return null;
  }
}

export function storeSession(token: string, user: CurrentUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/** Raised for any non-2xx response; carries the status so callers can branch. */
export class ApiError extends Error {
  status: number;
  /** DRF's field-level errors, when the response was a validation failure. */
  fields?: Record<string, string[]>;

  constructor(status: number, message: string, fields?: Record<string, string[]>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fields = fields;
  }
}

/** Subscribers notified when the session is rejected, so the UI can react. */
const unauthorizedHandlers = new Set<() => void>();

export function onUnauthorized(handler: () => void): () => void {
  unauthorizedHandlers.add(handler);
  return () => unauthorizedHandlers.delete(handler);
}

function extractMessage(status: number, body: unknown): string {
  if (typeof body === "string" && body) return body;
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    if (typeof record.detail === "string") return record.detail;
    // DRF field errors: surface the first one so a form can show something
    // useful even before it maps `fields` onto its inputs.
    for (const value of Object.values(record)) {
      if (Array.isArray(value) && typeof value[0] === "string") return value[0];
    }
  }
  return `Request failed (${status})`;
}

export interface RequestOptions {
  method?: string;
  body?: unknown;
  params?: Record<string, string | number | undefined | null>;
  signal?: AbortSignal;
  /** Send as multipart instead of JSON — needed for the company logo upload. */
  formData?: FormData;
}

/**
 * Resolve a path against the API.
 *
 * Paths are relative to `/api/admin` by default. A path already starting with
 * `/api/` is used as-is, which is how the shared endpoints outside the admin
 * namespace (Knox's `/api/auth/logout/`) are reached.
 */
function resolve(path: string): URL {
  const full = path.startsWith("/api/") ? path : `${API_BASE}${path}`;
  return new URL(full, window.location.origin);
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, params, signal, formData } = options;

  const url = resolve(path);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Token ${token}`;
  if (body !== undefined && !formData) headers["Content-Type"] = "application/json";

  const response = await fetch(url.toString(), {
    method,
    headers,
    signal,
    body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
  });

  if (response.status === 401) {
    clearSession();
    unauthorizedHandlers.forEach((handler) => handler());
    throw new ApiError(401, "Your session has expired. Please sign in again.");
  }

  if (response.status === 204) return undefined as T;

  const contentType = response.headers.get("Content-Type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text();

  if (!response.ok) {
    const fields =
      payload && typeof payload === "object" && !Array.isArray(payload)
        ? (payload as Record<string, string[]>)
        : undefined;
    throw new ApiError(response.status, extractMessage(response.status, payload), fields);
  }

  return payload as T;
}

/**
 * Trigger a file download for the Excel/PDF export endpoints.
 *
 * These return an attachment rather than JSON, and a plain <a href> can't
 * carry the Authorization header, so the blob is fetched and handed to a
 * throwaway object URL.
 */
export async function download(path: string, params?: RequestOptions["params"]) {
  const url = resolve(path);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }
  const token = getToken();
  const response = await fetch(url.toString(), {
    headers: token ? { Authorization: `Token ${token}` } : {},
  });
  if (!response.ok) {
    throw new ApiError(response.status, `Export failed (${response.status})`);
  }

  const disposition = response.headers.get("Content-Disposition") ?? "";
  const match = /filename="?([^"]+)"?/.exec(disposition);
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = match?.[1] ?? "export";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}
