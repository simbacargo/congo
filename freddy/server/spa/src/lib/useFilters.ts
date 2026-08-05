/**
 * Filter state held in the URL.
 *
 * Keeping filters in the query string (rather than component state) means a
 * filtered view is shareable and survives reload — the same property the
 * Django pages get for free from GET forms, and something the old htmx tables
 * lost as soon as you paged.
 */
import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

export type Filters = Record<string, string>;

export function useFilters(defaults: Filters = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const values = useMemo<Filters>(() => {
    const result: Filters = { ...defaults };
    searchParams.forEach((value, key) => {
      result[key] = value;
    });
    return result;
    // `defaults` is a literal at every call site; re-running on identity
    // changes would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  /** Merge changes, dropping empties, and reset to page 1 unless paging. */
  const setFilters = useCallback(
    (changes: Filters) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          for (const [key, value] of Object.entries(changes)) {
            if (value === "" || value === undefined || value === null) next.delete(key);
            else next.set(key, value);
          }
          if (!("page" in changes)) next.delete("page");
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const clear = useCallback(() => setSearchParams({}, { replace: true }), [setSearchParams]);

  const page = Number.parseInt(values.page ?? "1", 10) || 1;
  const setPage = useCallback(
    (next: number) => setFilters({ page: String(next) }),
    [setFilters],
  );

  /** Non-empty filters excluding paging — drives the active-filter chips. */
  const active = useMemo(
    () => Object.entries(values).filter(([key, value]) => key !== "page" && value !== ""),
    [values],
  );

  return { values, setFilters, clear, page, setPage, active };
}

/** Strip paging keys before sending filters to the API as query params. */
export function toParams(values: Filters): Record<string, string> {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== ""));
}
