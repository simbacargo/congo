/**
 * The shared transaction-history block, equivalent to `partials/history.html`.
 *
 * Summary tiles cover the *whole* filtered set, not just the visible page —
 * that is computed server-side by `history_summary`, so an agent scrolling
 * deep still sees their true running totals.
 */
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import type { HistoryResponse } from "@/api/types";
import { Card, KpiCard, Pagination, StatusBadge } from "./ui";
import { DataTable, type Column } from "./DataTable";
import { DateRangeFields, FilterSelect } from "./FilterBar";
import type { Filters } from "@/lib/useFilters";
import { dateTime, usd } from "@/lib/format";
import type { Transaction } from "@/api/types";

const STATUSES = ["PENDING", "VERIFIED", "REMITTED"];

export function HistoryBlock({
  data,
  isLoading,
  isError,
  onRetry,
  filters,
  setFilters,
  page,
  setPage,
  hideStation = false,
  hideAgent = false,
  hideChurch = false,
  hideLevy = false,
}: {
  data: HistoryResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  filters: Filters;
  setFilters: (changes: Filters) => void;
  page: number;
  setPage: (page: number) => void;
  hideStation?: boolean;
  hideAgent?: boolean;
  hideChurch?: boolean;
  hideLevy?: boolean;
}) {
  const { t } = useTranslation();
  const summary = data?.summary;

  const columns: Column<Transaction>[] = [
    {
      key: "receipt",
      header: t("tx.receipt"),
      render: (tx) => (
        <Link to={`/transactions/${tx.id}`} className="receipt-code hover:underline">
          {tx.receipt_code}
        </Link>
      ),
    },
    ...(hideStation
      ? []
      : [{ key: "station", header: t("tx.station"), render: (tx: Transaction) => tx.station_name }]),
    ...(hideAgent
      ? []
      : [{ key: "agent", header: t("tx.agent"), render: (tx: Transaction) => tx.agent_username }]),
    ...(hideChurch ? [] : [{ key: "church", header: t("tx.church"), render: (tx: Transaction) => tx.church_name }]),
    ...(hideLevy
      ? []
      : [
          {
            key: "levy",
            header: t("tx.levyUsd"),
            numeric: true,
            render: (tx: Transaction) => <span className="money">{usd(tx.levy_amount_usd)}</span>,
          },
        ]),
    { key: "status", header: t("common.status"), render: (tx) => <StatusBadge status={tx.status} /> },
    {
      key: "date",
      header: t("common.date"),
      render: (tx) => <span className="text-xs text-muted">{dateTime(tx.created_at)}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={t("history.transactions")} value={summary?.count ?? 0} />
        {!hideLevy && (
          <KpiCard
            label={t("history.totalLevy")}
            value={usd(summary?.total_levy_usd)}
            accent
          />
        )}
        <KpiCard label={t("history.totalAmount")} value={usd(summary?.total_amount_usd)} />
        <KpiCard
          label={t("history.lastAt")}
          value={<span className="text-base">{dateTime(summary?.last_at)}</span>}
        />
      </div>

      <div className="card grid gap-2 p-3 sm:grid-cols-3">
        <DateRangeFields values={filters} onChange={setFilters} fromKey="from" toKey="to" />
        <FilterSelect
          value={filters.status ?? ""}
          onChange={(value) => setFilters({ status: value })}
          options={STATUSES.map((status) => ({ value: status, label: t(`status.${status}`) }))}
          placeholder={t("tx.allStatuses")}
        />
      </div>

      <Card bodyClassName="">
        <DataTable
          columns={columns}
          rows={data?.results}
          rowKey={(tx) => tx.id}
          isLoading={isLoading}
          isError={isError}
          onRetry={onRetry}
          emptyMessage={t("history.empty")}
        />
        <Pagination page={page} numPages={data?.num_pages ?? 1} onChange={setPage} />
      </Card>
    </div>
  );
}
