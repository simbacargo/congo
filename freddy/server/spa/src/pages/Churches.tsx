import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useChurch, useChurches } from "@/api/hooks";
import { useAuth } from "@/auth/AuthProvider";
import { Card, DetailRow, ErrorState, KpiCard, Spinner, StatusBadge } from "@/components/ui";
import { DataTable, type Column } from "@/components/DataTable";
import type { Church, Disbursement, Transaction } from "@/api/types";
import { date, dateTime, number, orDash, usd } from "@/lib/format";

export default function Churches() {
  const { t } = useTranslation();
  const { can } = useAuth();
  const query = useChurches();

  const columns: Column<Church>[] = [
    {
      key: "name",
      header: t("church.name"),
      render: (row) => (
        <Link to={`/churches/${row.id}`} className="font-medium hover:underline">
          {row.name}
        </Link>
      ),
    },
    { key: "station", header: t("church.station"), render: (row) => row.station_name },
    { key: "company", header: t("tx.company"), render: (row) => row.company_name },
    { key: "contact", header: t("church.contactPerson"), render: (row) => orDash(row.contact_person) },
    { key: "phone", header: t("church.contactPhone"), render: (row) => orDash(row.contact_phone) },
    {
      key: "beneficiaries",
      header: t("church.beneficiaries"),
      numeric: true,
      render: (row) => number(row.beneficiary_count),
    },
    { key: "txs", header: t("history.transactions"), numeric: true, render: (row) => number(row.tx_count) },
    {
      key: "levy",
      header: t("tx.levyUsd"),
      numeric: true,
      render: (row) => <span className="money">{usd(row.total_levy)}</span>,
    },
    ...(can("manage_churches")
      ? [
          {
            key: "actions",
            header: t("common.actions"),
            render: (row: Church) => (
              <Link to={`/churches/${row.id}/edit`} className="btn btn-quiet">
                {t("common.edit")}
              </Link>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">{t("church.title")}</h1>
        {can("manage_churches") && (
          <Link to="/churches/new" className="btn btn-primary">
            {t("church.newChurch")}
          </Link>
        )}
      </header>

      <Card bodyClassName="">
        <DataTable
          columns={columns}
          rows={query.data?.results}
          rowKey={(row) => row.id}
          isLoading={query.isLoading}
          isError={query.isError}
          onRetry={() => void query.refetch()}
        />
      </Card>
    </div>
  );
}

export function ChurchDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { can } = useAuth();
  const query = useChurch(id);

  if (query.isLoading) return <Spinner />;
  if (query.isError || !query.data) return <ErrorState onRetry={() => void query.refetch()} />;

  const church = query.data;

  const txColumns: Column<Transaction>[] = [
    {
      key: "receipt",
      header: t("tx.receipt"),
      render: (row) => (
        <Link to={`/transactions/${row.id}`} className="receipt-code hover:underline">
          {row.receipt_code}
        </Link>
      ),
    },
    { key: "agent", header: t("tx.agent"), render: (row) => row.agent_username },
    {
      key: "levy",
      header: t("tx.levyUsd"),
      numeric: true,
      render: (row) => <span className="money">{usd(row.levy_amount_usd)}</span>,
    },
    { key: "status", header: t("common.status"), render: (row) => <StatusBadge status={row.status} /> },
    {
      key: "date",
      header: t("common.date"),
      render: (row) => <span className="text-xs text-muted">{dateTime(row.created_at)}</span>,
    },
  ];

  const disbColumns: Column<Disbursement>[] = [
    { key: "ref", header: t("disbursement.reference"), render: (row) => <span className="num text-xs">{row.reference}</span> },
    {
      key: "period",
      header: t("common.date"),
      render: (row) => (
        <span className="text-xs">
          {date(row.period_start)} → {date(row.period_end)}
        </span>
      ),
    },
    { key: "amount", header: t("disbursement.amountUsd"), numeric: true, render: (row) => usd(row.amount_usd) },
    { key: "status", header: t("common.status"), render: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/churches" className="text-xs text-muted hover:underline">
            ← {t("church.title")}
          </Link>
          <h1 className="text-lg font-semibold">{church.name}</h1>
          <p className="text-xs text-muted">
            {church.station_name} · {church.company_name}
          </p>
        </div>
        {can("manage_churches") && (
          <Link to={`/churches/${church.id}/edit`} className="btn">
            {t("common.edit")}
          </Link>
        )}
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label={t("history.totalLevy")} value={usd(church.totals?.levy)} accent />
        <KpiCard label={t("history.transactions")} value={number(church.totals?.count)} />
        <KpiCard label={t("church.beneficiaries")} value={number(church.beneficiary_count)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title={t("church.title")}>
          <DetailRow label={t("church.station")} value={church.station_name} />
          <DetailRow label={t("church.contactPerson")} value={orDash(church.contact_person)} />
          <DetailRow label={t("church.contactPhone")} value={orDash(church.contact_phone)} />
          <DetailRow
            label={t("common.status")}
            value={church.is_active ? t("common.active") : t("common.inactive")}
          />
        </Card>

        <Card className="lg:col-span-2" title={t("dashboard.recent")} bodyClassName="">
          <DataTable
            columns={txColumns}
            rows={church.transactions}
            rowKey={(row) => row.id}
            emptyMessage={t("history.empty")}
          />
        </Card>
      </div>

      <Card title={t("disbursement.title")} bodyClassName="">
        <DataTable
          columns={disbColumns}
          rows={church.disbursements}
          rowKey={(row) => row.id}
          emptyMessage={t("common.noResults")}
        />
      </Card>
    </div>
  );
}
