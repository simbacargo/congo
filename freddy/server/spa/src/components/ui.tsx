/**
 * Small shared building blocks.
 *
 * These lean on the component classes in static/src/_tokens.css (.card, .btn*,
 * .field, .badge-<STATUS>, .tbl) rather than re-styling from scratch, so the
 * SPA and the Django pages stay visually identical.
 */
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

export function Card({
  title,
  actions,
  children,
  className = "",
  bodyClassName = "p-4",
}: {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={`card ${className}`}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          {typeof title === "string" ? (
            <h2 className="text-sm font-semibold">{title}</h2>
          ) : (
            title
          )}
          {actions}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="kpi-card">
      <p className="kpi-label">{label}</p>
      <p className={`kpi-value ${accent ? "money" : ""}`}>{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-muted">{hint}</p>}
    </div>
  );
}

/** Status pill. `.badge-<STATUS>` classes already exist in the shared CSS. */
export function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  return <span className={`badge badge-${status}`}>{t(`status.${status}`, status)}</span>;
}

export function EmptyState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      <p className="text-sm text-muted">{message}</p>
      {action}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-muted">
      <span
        className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-line border-t-accent"
        aria-hidden
      />
      {label ?? t("common.loading")}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
      <p className="text-sm text-danger">{message ?? t("common.error")}</p>
      {onRetry && (
        <button type="button" className="btn" onClick={onRetry}>
          {t("common.retry")}
        </button>
      )}
    </div>
  );
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-xs font-medium">
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-[11px] text-muted">{hint}</p>}
      {error && <p className="text-[11px] text-danger">{error}</p>}
    </div>
  );
}

/** Label/value row used across the detail pages. */
export function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line py-1.5 last:border-0">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-sm text-right">{value ?? "—"}</span>
    </div>
  );
}

export function Pagination({
  page,
  numPages,
  onChange,
}: {
  page: number;
  numPages: number;
  onChange: (page: number) => void;
}) {
  const { t } = useTranslation();
  if (numPages <= 1) return null;
  return (
    <nav className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 text-xs">
      <button
        type="button"
        className="btn"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        {t("common.previous")}
      </button>
      <span className="text-muted">
        {t("common.page")} {page} {t("common.of")} {numPages}
      </span>
      <button
        type="button"
        className="btn"
        disabled={page >= numPages}
        onClick={() => onChange(page + 1)}
      >
        {t("common.next")}
      </button>
    </nav>
  );
}
