import { get, writable } from "svelte/store";
import { ApiError, authApi } from "./api";
import { clearToken, getToken, setToken } from "./storage";
import type { MeResponse, Permissions, User } from "./types";

export const currentUser = writable<User | null>(null);
export const permissions = writable<Permissions>({});
export const pendingCount = writable(0);
export const authReady = writable(false);
export const authError = writable("");

function applyBootstrap(data: MeResponse): void {
  currentUser.set(data.user);
  permissions.set(data.permissions);
  pendingCount.set(data.pending_count || 0);
  authError.set("");
}

export async function hydrateAuth(): Promise<void> {
  if (!getToken()) {
    authReady.set(true);
    return;
  }
  try {
    applyBootstrap(await authApi.me());
  } catch {
    clearSession();
  } finally {
    authReady.set(true);
  }
}

export async function login(username: string, password: string): Promise<void> {
  authError.set("");
  const response = await authApi.login(username, password);
  setToken(response.token);
  try {
    applyBootstrap(await authApi.me());
  } catch (error) {
    clearSession();
    if (error instanceof ApiError) throw error;
    throw new Error("Unable to load the account profile.");
  }
}

export async function logout(): Promise<void> {
  try { await authApi.logout(); } finally { clearSession(); }
}

export function clearSession(): void {
  clearToken();
  currentUser.set(null);
  permissions.set({});
  pendingCount.set(0);
}

export function can(permission: string): boolean {
  const user = get(currentUser);
  return Boolean(user?.is_superuser || get(permissions)[permission]);
}

export function displayName(user: User | null): string {
  if (!user) return "";
  return [user.firstname, user.lastname].filter(Boolean).join(" ") || user.username;
}
