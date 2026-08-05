/**
 * Table with the loading / error / empty states handled once.
 *
 * Every list page hit the same four-way branch; centralising it keeps the
 * pages to a column definition and a row renderer.
 */
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { EmptyState, ErrorState, Spinner } from "./ui";

export interface Column<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  /** Right-aligns and applies the tabular-numeral class. */
  numeric?: boolean;
  className?: string;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  isLoading,
  isError,
  onRetry,
  emptyMessage,
  footer,
  sticky = false,
}: {
  columns: Column<T>[];
  rows: T[] | undefined;
  rowKey: (row: T) => string;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  emptyMessage?: string;
  footer?: ReactNode;
  sticky?: boolean;
}) {
  const { t } = useTranslation();

  if (isLoading) return <Spinner />;
  if (isError) return <ErrorState onRetry={onRetry} />;
  if (!rows || rows.length === 0) {
    return <EmptyState message={emptyMessage ?? t("common.noResults")} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className={`tbl tbl-zebra ${sticky ? "tbl-sticky" : ""}`}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`${column.numeric ? "text-right" : ""} ${column.className ?? ""}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`${column.numeric ? "num text-right" : ""} ${column.className ?? ""}`}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {footer}
      </table>
    </div>
  );
}
