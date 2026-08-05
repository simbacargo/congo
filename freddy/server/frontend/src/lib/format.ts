export function numberValue(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function money(value: unknown, currency = "USD"): string {
  const amount = numberValue(value);
  const formatted = amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
  return currency === "CDF" ? `${formatted} FC` : `$${formatted}`;
}

export function shortMoney(value: unknown): string {
  const amount = numberValue(value);
  if (Math.abs(amount) >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}m`;
  if (Math.abs(amount) >= 1_000) return `$${(amount / 1_000).toFixed(1)}k`;
  return money(amount);
}

export function dateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

export function dateOnly(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("fr-FR");
}

export function humanRole(role: string): string {
  return {
    NGO_ADMIN: "NGO Admin",
    COMPANY_MANAGER: "Company Manager",
    STATION_AGENT: "Station Agent",
  }[role] || role;
}

export function statusLabel(status: string): string {
  return {
    PENDING: "Pending",
    VERIFIED: "Verified",
    REMITTED: "Remitted",
    SCHEDULED: "Scheduled",
    PAID: "Paid",
    CANCELLED: "Cancelled",
  }[status] || status;
}

export function statusClass(status: string): string {
  return `status status-${String(status).toLowerCase()}`;
}
