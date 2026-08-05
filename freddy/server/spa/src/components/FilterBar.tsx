/**
 * Filter controls plus removable chips for what is currently applied.
 *
 * The chips mirror the Drivers page in the Django UI, where each active filter
 * can be dropped individually — useful when five filters are stacked and you
 * only want to widen one.
 */
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import type { Filters } from "@/lib/useFilters";

export interface SelectOption {
  value: string;
  label: string;
}

export function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder: string;
  label?: string;
}) {
  return (
    <select
      className="field"
      aria-label={label ?? placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function FilterBar({
  children,
  active,
  labels,
  onRemove,
  onClear,
}: {
  children: ReactNode;
  /** `[key, value]` pairs currently applied, excluding paging. */
  active: [string, string][];
  /** Human labels per filter key, and optionally per value. */
  labels?: Record<string, string>;
  onRemove: (key: string) => void;
  onClear: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="card space-y-3 p-3">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">{children}</div>

      {active.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
          {active.map(([key, value]) => (
            <button
              key={key}
              type="button"
              onClick={() => onRemove(key)}
              className="badge badge-SCHEDULED hover:opacity-80"
              title={t("common.clear")}
            >
              <span className="font-normal opacity-70">{labels?.[key] ?? key}:</span> {value} ✕
            </button>
          ))}
          <button type="button" className="btn btn-quiet" onClick={onClear}>
            {t("common.clearFilters")}
          </button>
        </div>
      )}
    </div>
  );
}

/** Two date inputs, used by the transaction, history and audit filters. */
export function DateRangeFields({
  values,
  onChange,
  fromKey = "date_from",
  toKey = "date_to",
}: {
  values: Filters;
  onChange: (changes: Filters) => void;
  fromKey?: string;
  toKey?: string;
}) {
  const { t } = useTranslation();
  return (
    <>
      <input
        type="date"
        className="field"
        aria-label={t("common.from")}
        value={values[fromKey] ?? ""}
        onChange={(event) => onChange({ [fromKey]: event.target.value })}
      />
      <input
        type="date"
        className="field"
        aria-label={t("common.to")}
        value={values[toKey] ?? ""}
        onChange={(event) => onChange({ [toKey]: event.target.value })}
      />
    </>
  );
}
