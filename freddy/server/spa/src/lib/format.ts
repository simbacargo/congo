/**
 * Display formatting.
 *
 * Money arrives from DRF as decimal *strings* (levies carry 4 dp, amounts 2)
 * so precision survives the wire. Parse late and only for display — never
 * accumulate in JS floats.
 */
import i18n from "@/i18n";

function locale(): string {
  return i18n.language === "en" ? "en-GB" : i18n.language === "sw" ? "sw-KE" : "fr-FR";
}

export function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** `$1,234.56` — the levy figures the dashboard leads with. */
export function usd(value: string | number | null | undefined, digits = 2): string {
  return new Intl.NumberFormat(locale(), {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(toNumber(value));
}

export function cdf(value: string | number | null | undefined): string {
  return new Intl.NumberFormat(locale(), {
    style: "currency",
    currency: "CDF",
    maximumFractionDigits: 0,
  }).format(toNumber(value));
}

export function number(value: string | number | null | undefined): string {
  return new Intl.NumberFormat(locale()).format(toNumber(value));
}

export function percent(value: number | null | undefined): string {
  return `${Math.round(value ?? 0)}%`;
}

export function date(value: string | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat(locale(), { dateStyle: "medium" }).format(new Date(value));
}

export function dateTime(value: string | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat(locale(), {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

/** Short axis label for the trend chart, e.g. `04 Aug`. */
export function shortDate(value: string): string {
  return value;
}

export function fullName(
  person: { firstname?: string | null; lastname?: string | null; username?: string } | null,
): string {
  if (!person) return "—";
  const name = [person.firstname, person.lastname].filter(Boolean).join(" ").trim();
  return name || person.username || "—";
}

/** Renders `—` for the empty values that pepper the imported driver data. */
export function orDash(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}
