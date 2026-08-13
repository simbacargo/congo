import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { download } from "@/api/client";
import { useBulkTransactions, useCompanies, useStations, useTransactions } from "@/api/hooks";
import type { Transaction } from "@/api/types";
import { useAuth } from "@/auth/AuthProvider";
import { DataTable, type Column } from "@/components/DataTable";
import { DateRangeFields, FilterBar, FilterSelect } from "@/components/FilterBar";
import { Card, Pagination, StatusBadge } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { useDebounced } from "@/lib/useDebounced";
import { useFilters, toParams } from "@/lib/useFilters";
import { dateTime, number, usd } from "@/lib/format";

const PAGE_SIZE = 25;
const STATUSES = ["PENDING", "VERIFIED", "REMITTED"];

export default function Transactions() {
  const { t } = useTranslation();
  const { can } = useAuth();
  const toast = useToast();
  const { values, setFilters, clear, page, setPage, active } = useFilters();

  // The search box updates on every keystroke but only reaches the API after
  // it settles, matching the 300ms debounce the Django table used.
  const [search, setSearch] = useState(values.search ?? "");
  const debouncedSearch = useDebounced(search);
  useEffect(() => {
    if (debouncedSearch !== (values.search ?? "")) setFilters({ search: debouncedSearch });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const query = useTransactions({ ...toParams(values), page });
  const companies = useCompanies();
  const stations = useStations();
  const bulk = useBulkTransactions();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const canBulk = can("bulk_update_transactions");

  // Selections refer to rows on the current page; a filter or page change
  // makes them meaningless.
  useEffect(() => setSelected(new Set()), [values, page]);

  const rows = query.data?.results ?? [];
  const allSelected = rows.length > 0 && rows.every((tx) => selected.has(tx.id));

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(rows.map((tx) => tx.id)));
  }

  async function runBulk(action: "verify" | "remit") {
    try {
      const result = await bulk.mutateAsync({ ids: [...selected], action });
      toast.success(t("tx.bulkDone", { count: result.updated }));
      setSelected(new Set());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.error"));
    }
  }

  const columns: Column<Transaction>[] = [
    ...(canBulk
      ? [
          {
            key: "select",
            className: "w-8",
            header: (
              <input
                type="checkbox"
                className="check"
                checked={allSelected}
                onChange={toggleAll}
                aria-label={t("common.all")}
              />
            ),
            render: (tx: Transaction) => (
              <input
                type="checkbox"
                className="check"
                checked={selected.has(tx.id)}
                onChange={() => toggle(tx.id)}
                aria-label={tx.receipt_code}
              />
            ),
          },
        ]
      : []),
    {
      key: "receipt",
      header: t("tx.receipt"),
      render: (tx) => (
        <Link to={`/transactions/${tx.id}`} className="receipt-code hover:underline">
          {tx.receipt_code}
        </Link>
      ),
    },
    { key: "company", header: t("tx.company"), render: (tx) => tx.company_name },
    { key: "station", header: t("tx.station"), render: (tx) => tx.station_name },
    { key: "agent", header: t("tx.agent"), render: (tx) => tx.agent_username },
    {
      key: "amount",
      header: t("tx.amountUsd"),
      numeric: true,
      render: (tx) => usd(tx.amount_usd),
    },
    { key: "status", header: t("common.status"), render: (tx) => <StatusBadge status={tx.status} /> },
    {
      key: "date",
      header: t("common.date"),
      render: (tx) => <span className="whitespace-nowrap text-xs text-muted">{dateTime(tx.created_at)}</span>,
    },
  ];

  const totals = query.data?.totals;
  const numPages = Math.max(1, Math.ceil((query.data?.count ?? 0) / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">{t("tx.title")}</h1>
          {totals && <p className="text-xs text-muted">{number(totals.count)} {t("history.transactions")}</p>}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn"
            onClick={() => void download("/transactions/export/excel/", toParams(values))}
          >
            {t("common.exportExcel")}
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => void download("/transactions/export/pdf/", toParams(values))}
          >
            {t("common.exportPdf")}
          </button>
        </div>
      </header>

      <FilterBar
        active={active.filter(([key]) => key !== "search") as [string, string][]}
        labels={{
          company: t("tx.company"),
          station: t("tx.station"),
          status: t("common.status"),
          date_from: t("common.from"),
          date_to: t("common.to"),
        }}
        onRemove={(key) => setFilters({ [key]: "" })}
        onClear={() => {
          setSearch("");
          clear();
        }}
      >
        <input
          className="field lg:col-span-2"
          placeholder={t("tx.searchPlaceholder")}
          aria-label={t("common.search")}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <FilterSelect
          value={values.company ?? ""}
          onChange={(value) => setFilters({ company: value })}
          options={(companies.data?.results ?? []).map((c) => ({ value: c.id, label: c.name }))}
          placeholder={t("tx.allCompanies")}
        />
        <FilterSelect
          value={values.station ?? ""}
          onChange={(value) => setFilters({ station: value })}
          options={(stations.data?.results ?? []).map((s) => ({ value: s.id, label: s.name }))}
          placeholder={t("tx.allStations")}
        />
        <FilterSelect
          value={values.status ?? ""}
          onChange={(value) => setFilters({ status: value })}
          options={STATUSES.map((status) => ({ value: status, label: t(`status.${status}`) }))}
          placeholder={t("tx.allStatuses")}
        />
        <DateRangeFields values={values} onChange={setFilters} />
      </FilterBar>

      {canBulk && selected.size > 0 && (
        <div className="card flex flex-wrap items-center gap-3 p-3">
          <span className="text-sm">{t("tx.selected", { count: selected.size })}</span>
          <div className="flex-1" />
          <button
            type="button"
            className="btn"
            disabled={bulk.isPending}
            onClick={() => void runBulk("verify")}
          >
            {t("tx.markVerified")}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={bulk.isPending}
            onClick={() => void runBulk("remit")}
          >
            {t("tx.markRemitted")}
          </button>
        </div>
      )}

      <Card bodyClassName="">
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(tx) => tx.id}
          isLoading={query.isLoading}
          isError={query.isError}
          onRetry={() => void query.refetch()}
          sticky
        />
        <Pagination page={page} numPages={numPages} onChange={setPage} />
      </Card>
    </div>
  );
}
