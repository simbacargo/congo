const TOKEN_KEY = "freddy.frontend.knox-token";
const LOCALE_KEY = "freddy.frontend.locale";

export function getToken(): string | null {
  return typeof window === "undefined" ? null : window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
}

export function getStoredLocale(): string {
  return typeof window === "undefined" ? "fr" : window.localStorage.getItem(LOCALE_KEY) || "fr";
}

export function setStoredLocale(locale: string): void {
  window.localStorage.setItem(LOCALE_KEY, locale);
}
