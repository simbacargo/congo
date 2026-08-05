import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useAuditLog } from "@/api/hooks";
import type { AuditRow } from "@/api/types";
import { Card, Pagination } from "@/components/ui";
import { DataTable, type Column } from "@/components/DataTable";
import { DateRangeFields, FilterBar, FilterSelect } from "@/components/FilterBar";
import { useDebounced } from "@/lib/useDebounced";
import { useFilters, toParams } from "@/lib/useFilters";
import { dateTime, orDash } from "@/lib/format";

const PAGE_SIZE = 25;
/** The only fields `record_audit_log` is ever called with. */
const FIELDS = ["status", "notes", "amount_usd", "amount_cdf"];

export default function Audit() {
  const { t } = useTranslation();
  const { values, setFilters, clear, page, setPage, active } = useFilters();

  const [search, setSearch] = useState(values.q ?? "");
  const debouncedSearch = useDebounced(search);
  useEffect(() => {
    if (debouncedSearch !== (values.q ?? "")) setFilters({ q: debouncedSearch });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const query = useAuditLog({ ...toParams(values), page });

  const columns: Column<AuditRow>[] = [
    {
      key: "receipt",
      header: t("tx.receipt"),
      render: (row) => <span className="receipt-code">{row.receipt_code}</span>,
    },
    { key: "company", header: t("tx.company"), render: (row) => row.company_name },
    { key: "field", header: t("tx.field"), render: (row) => <span className="font-medium">{row.field_name}</span> },
    {
      key: "old",
      header: t("tx.oldValue"),
      render: (row) => <span className="badge badge-CANCELLED">{orDash(row.old_value)}</span>,
    },
    {
      key: "new",
      header: t("tx.newValue"),
      render: (row) => <span className="badge badge-VERIFIED">{orDash(row.new_value)}</span>,
    },
    { key: "user", header: t("audit.user"), render: (row) => orDash(row.changed_by_username) },
    {
      key: "at",
      header: t("tx.changedAt"),
      render: (row) => <span className="whitespace-nowrap text-xs text-muted">{dateTime(row.changed_at)}</span>,
    },
    {
      key: "ip",
      header: t("audit.ip"),
      render: (row) => <span className="num text-xs text-muted">{orDash(row.ip_address)}</span>,
    },
  ];

  const numPages = Math.max(1, Math.ceil((query.data?.count ?? 0) / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-lg font-semibold">{t("audit.title")}</h1>
      </header>

      <FilterBar
        active={active.filter(([key]) => key !== "q") as [string, string][]}
        labels={{
          field: t("tx.field"),
          user: t("audit.user"),
          from: t("common.from"),
          to: t("common.to"),
        }}
        onRemove={(key) => setFilters({ [key]: "" })}
        onClear={() => {
          setSearch("");
          clear();
        }}
      >
        <input
          className="field lg:col-span-2"
          placeholder={t("audit.searchPlaceholder")}
          aria-label={t("common.search")}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <FilterSelect
          value={values.field ?? ""}
          onChange={(value) => setFilters({ field: value })}
          options={FIELDS.map((field) => ({ value: field, label: field }))}
          placeholder={t("audit.allFields")}
        />
        <input
          className="field"
          placeholder={t("audit.user")}
          aria-label={t("audit.user")}
          value={values.user ?? ""}
          onChange={(event) => setFilters({ user: event.target.value })}
        />
        <DateRangeFields values={values} onChange={setFilters} fromKey="from" toKey="to" />
      </FilterBar>

      <Card bodyClassName="">
        <DataTable
          columns={columns}
          rows={query.data?.results}
          rowKey={(row) => String(row.id)}
          isLoading={query.isLoading}
          isError={query.isError}
          onRetry={() => void query.refetch()}
          emptyMessage={t("audit.empty")}
          sticky
        />
        <Pagination page={page} numPages={numPages} onChange={setPage} />
      </Card>

      <p className="text-center text-xs text-muted">
        <Link to="/transactions" className="hover:underline">
          {t("tx.title")}
        </Link>
      </p>
    </div>
  );
}
