import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useDisbursements, useMarkDisbursementPaid } from "@/api/hooks";
import type { Disbursement } from "@/api/types";
import { Card, Pagination, StatusBadge } from "@/components/ui";
import { DataTable, type Column } from "@/components/DataTable";
import { useToast } from "@/components/Toast";
import { useFilters, toParams } from "@/lib/useFilters";
import { date, number, orDash, usd } from "@/lib/format";

const PAGE_SIZE = 25;
const STATUSES = ["SCHEDULED", "PAID", "CANCELLED"];

export default function Disbursements() {
  const { t } = useTranslation();
  const toast = useToast();
  const { values, setFilters, page, setPage } = useFilters();
  const query = useDisbursements({ ...toParams(values), page });
  const markPaid = useMarkDisbursementPaid();

  async function pay(id: string) {
    try {
      await markPaid.mutateAsync(id);
      toast.success(t("disbursement.paid"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.error"));
    }
  }

  const columns: Column<Disbursement>[] = [
    {
      key: "reference",
      header: t("disbursement.reference"),
      render: (row) => <span className="num text-xs">{row.reference}</span>,
    },
    {
      key: "church",
      header: t("disbursement.church"),
      render: (row) => (
        <Link to={`/churches/${row.church}`} className="font-medium hover:underline">
          {row.church_name}
        </Link>
      ),
    },
    {
      key: "period",
      header: t("common.date"),
      render: (row) => (
        <span className="whitespace-nowrap text-xs">
          {date(row.period_start)} → {date(row.period_end)}
        </span>
      ),
    },
    {
      key: "amount",
      header: t("disbursement.amountUsd"),
      numeric: true,
      render: (row) => <span className="money">{usd(row.amount_usd)}</span>,
    },
    { key: "method", header: t("disbursement.paymentMethod"), render: (row) => orDash(row.payment_method) },
    { key: "status", header: t("common.status"), render: (row) => <StatusBadge status={row.status} /> },
    {
      key: "preparedBy",
      header: t("disbursement.preparedBy"),
      render: (row) => orDash(row.prepared_by_username),
    },
    {
      key: "actions",
      header: t("common.actions"),
      render: (row) => (
        <div className="flex gap-1">
          <Link to={`/disbursements/${row.id}/edit`} className="btn btn-quiet">
            {t("common.edit")}
          </Link>
          {row.status === "SCHEDULED" && (
            <button
              type="button"
              className="btn"
              disabled={markPaid.isPending}
              onClick={() => void pay(row.id)}
            >
              {t("disbursement.markPaid")}
            </button>
          )}
        </div>
      ),
    },
  ];

  const totals = query.data?.totals;
  const numPages = Math.max(1, Math.ceil((query.data?.count ?? 0) / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">{t("disbursement.title")}</h1>
          {totals && (
            <p className="text-xs text-muted">
              {number(totals.count)} · <span className="money">{usd(totals.total)}</span>
            </p>
          )}
        </div>
        <Link to="/disbursements/new" className="btn btn-primary">
          {t("disbursement.newDisbursement")}
        </Link>
      </header>

      {/* Status tabs, mirroring the Django filter bar. */}
      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          className={`btn ${!values.status ? "btn-primary" : "btn-quiet"}`}
          onClick={() => setFilters({ status: "" })}
        >
          {t("common.all")}
        </button>
        {STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            className={`btn ${values.status === status ? "btn-primary" : "btn-quiet"}`}
            onClick={() => setFilters({ status })}
          >
            {t(`status.${status}`)}
          </button>
        ))}
      </div>

      <Card bodyClassName="">
        <DataTable
          columns={columns}
          rows={query.data?.results}
          rowKey={(row) => row.id}
          isLoading={query.isLoading}
          isError={query.isError}
          onRetry={() => void query.refetch()}
        />
        <Pagination page={page} numPages={numPages} onChange={setPage} />
      </Card>
    </div>
  );
}
