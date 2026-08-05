import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useCompanies, useCompany } from "@/api/hooks";
import { useAuth } from "@/auth/AuthProvider";
import { Card, DetailRow, ErrorState, KpiCard, Spinner } from "@/components/ui";
import { DataTable, type Column } from "@/components/DataTable";
import type { Company, Station } from "@/api/types";
import { number, orDash, usd } from "@/lib/format";

export default function Companies() {
  const { t } = useTranslation();
  const { can } = useAuth();
  const query = useCompanies();

  const columns: Column<Company>[] = [
    {
      key: "name",
      header: t("company.name"),
      render: (row) => (
        <Link to={`/companies/${row.id}`} className="font-medium hover:underline">
          {row.name}
        </Link>
      ),
    },
    { key: "code", header: t("company.code"), render: (row) => <span className="num">{row.code}</span> },
    { key: "stations", header: t("company.stations"), numeric: true, render: (row) => number(row.station_count) },
    { key: "txs", header: t("history.transactions"), numeric: true, render: (row) => number(row.tx_count) },
    {
      key: "levy",
      header: t("tx.levyUsd"),
      numeric: true,
      render: (row) => <span className="money">{usd(row.total_levy)}</span>,
    },
    { key: "phone", header: t("company.phone"), render: (row) => orDash(row.contact_phone) },
    {
      key: "active",
      header: t("common.status"),
      render: (row) => (
        <span className={`badge ${row.is_active ? "badge-VERIFIED" : "badge-CANCELLED"}`}>
          {row.is_active ? t("common.active") : t("common.inactive")}
        </span>
      ),
    },
    ...(can("manage_companies")
      ? [
          {
            key: "actions",
            header: t("common.actions"),
            render: (row: Company) => (
              <Link to={`/companies/${row.id}/edit`} className="btn btn-quiet">
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
        <h1 className="text-lg font-semibold">{t("company.title")}</h1>
        {can("manage_companies") && (
          <Link to="/companies/new" className="btn btn-primary">
            {t("company.newCompany")}
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

export function CompanyDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { can } = useAuth();
  const query = useCompany(id);

  if (query.isLoading) return <Spinner />;
  if (query.isError || !query.data) return <ErrorState onRetry={() => void query.refetch()} />;

  const company = query.data;

  const columns: Column<Station>[] = [
    {
      key: "name",
      header: t("station.name"),
      render: (row) => (
        <Link to={`/stations/${row.id}`} className="font-medium hover:underline">
          {row.name}
        </Link>
      ),
    },
    { key: "code", header: t("station.code"), render: (row) => <span className="num">{row.code}</span> },
    { key: "txs", header: t("history.transactions"), numeric: true, render: (row) => number(row.tx_count) },
    {
      key: "levy",
      header: t("tx.levyUsd"),
      numeric: true,
      render: (row) => <span className="money">{usd(row.total_levy)}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/companies" className="text-xs text-muted hover:underline">
            ← {t("company.title")}
          </Link>
          <h1 className="text-lg font-semibold">{company.name}</h1>
        </div>
        {can("manage_companies") && (
          <Link to={`/companies/${company.id}/edit`} className="btn">
            {t("common.edit")}
          </Link>
        )}
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label={t("company.stations")} value={number(company.stations?.length ?? 0)} />
        <KpiCard label={t("history.transactions")} value={number(company.totals?.tx_count)} />
        <KpiCard label={t("history.totalLevy")} value={usd(company.totals?.total_usd)} accent />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title={t("company.title")}>
          {company.logo && (
            <img
              src={company.logo}
              alt={company.name}
              className="mb-3 max-h-20 rounded border border-line object-contain"
            />
          )}
          <DetailRow label={t("company.code")} value={<span className="num">{company.code}</span>} />
          <DetailRow label={t("company.email")} value={orDash(company.contact_email)} />
          <DetailRow label={t("company.phone")} value={orDash(company.contact_phone)} />
          <DetailRow
            label={t("common.status")}
            value={company.is_active ? t("common.active") : t("common.inactive")}
          />
        </Card>

        <Card className="lg:col-span-2" title={t("company.stations")} bodyClassName="">
          <DataTable
            columns={columns}
            rows={company.stations}
            rowKey={(row) => row.id}
            emptyMessage={t("dashboard.noStations")}
          />
        </Card>
      </div>
    </div>
  );
}
