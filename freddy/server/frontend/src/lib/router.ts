import { writable } from "svelte/store";

export interface Route {
  name: string;
  id?: string;
}

const APP_BASE = "/frontend";

function withoutBase(pathname: string): string {
  const path = pathname.startsWith(APP_BASE) ? pathname.slice(APP_BASE.length) : pathname;
  return path.replace(/^\/+|\/+$/g, "");
}

export function parseRoute(pathname = window.location.pathname): Route {
  const parts = withoutBase(pathname).split("/").filter(Boolean);
  if (!parts.length) return { name: "dashboard" };
  const [resource, id] = parts;
  if (resource === "login") return { name: "login" };
  if (resource === "transactions") return id ? { name: "transaction-detail", id } : { name: "transactions" };
  if (resource === "companies") return id ? { name: "company-detail", id } : { name: "companies" };
  if (resource === "stations") return id ? { name: "station-detail", id } : { name: "stations" };
  if (resource === "churches") return id ? { name: "church-detail", id } : { name: "churches" };
  if (resource === "agents") return id ? { name: "agent-detail", id } : { name: "agents" };
  if (resource === "drivers") return id ? { name: "driver-detail", id } : { name: "drivers" };
  if (resource === "disbursements") return { name: "disbursements" };
  if (resource === "fuel-types") return { name: "fuel-types" };
  if (resource === "targets") return { name: "targets" };
  if (resource === "reports") return { name: "reports" };
  if (resource === "audit") return { name: "audit" };
  if (resource === "verify") return { name: "verify" };
  return { name: "not-found" };
}

export const route = writable<Route>(parseRoute());

export function routePath(name: string, id?: string): string {
  const paths: Record<string, string> = {
    dashboard: "", transactions: "transactions", companies: "companies", stations: "stations",
    churches: "churches", agents: "agents", drivers: "drivers", disbursements: "disbursements",
    "fuel-types": "fuel-types", targets: "targets", reports: "reports", audit: "audit", verify: "verify",
    "transaction-detail": "transactions", "company-detail": "companies", "station-detail": "stations",
    "church-detail": "churches", "agent-detail": "agents", "driver-detail": "drivers",
  };
  return `${APP_BASE}/${paths[name] ?? name}${id ? `/${id}` : ""}`;
}

export function navigate(path: string): void {
  const target = path.startsWith("/") ? path : routePath(path);
  window.history.pushState({}, "", target || APP_BASE);
  route.set(parseRoute(target || APP_BASE));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function startRouter(): () => void {
  const onPopState = () => route.set(parseRoute());
  window.addEventListener("popstate", onPopState);
  return () => window.removeEventListener("popstate", onPopState);
}
