import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useCompanies, useStation, useStationHistory, useStations } from "@/api/hooks";
import { useAuth } from "@/auth/AuthProvider";
import { Card, DetailRow, ErrorState, KpiCard, Spinner } from "@/components/ui";
import { DataTable, type Column } from "@/components/DataTable";
import { FilterSelect } from "@/components/FilterBar";
import { HistoryBlock } from "@/components/HistoryBlock";
import type { Church, Station } from "@/api/types";
import { useFilters, toParams } from "@/lib/useFilters";
import { number, orDash, usd } from "@/lib/format";

export default function Stations() {
  const { t } = useTranslation();
  const { can } = useAuth();
  const { values, setFilters } = useFilters();
  const query = useStations({ page_size: 100, ...toParams(values) });
  const companies = useCompanies();

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
    { key: "company", header: t("station.company"), render: (row) => row.company_name },
    { key: "churches", header: t("station.churches"), numeric: true, render: (row) => number(row.church_count) },
    { key: "txs", header: t("history.transactions"), numeric: true, render: (row) => number(row.tx_count) },
    {
      key: "levy",
      header: t("tx.levyUsd"),
      numeric: true,
      render: (row) => <span className="money">{usd(row.total_levy)}</span>,
    },
    ...(can("manage_stations")
      ? [
          {
            key: "actions",
            header: t("common.actions"),
            render: (row: Station) => (
              <Link to={`/stations/${row.id}/edit`} className="btn btn-quiet">
                {t("common.edit")}
              </Link>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">{t("station.title")}</h1>
        <div className="flex items-center gap-2">
          <FilterSelect
            value={values.company ?? ""}
            onChange={(value) => setFilters({ company: value })}
            options={(companies.data?.results ?? []).map((c) => ({ value: c.id, label: c.name }))}
            placeholder={t("tx.allCompanies")}
          />
          {can("manage_stations") && (
            <Link to="/stations/new" className="btn btn-primary">
              {t("station.newStation")}
            </Link>
          )}
        </div>
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

export function StationDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { can } = useAuth();
  const { values, setFilters, page, setPage } = useFilters();

  const query = useStation(id);
  const history = useStationHistory(id, { ...toParams(values), page });

  if (query.isLoading) return <Spinner />;
  if (query.isError || !query.data) return <ErrorState onRetry={() => void query.refetch()} />;

  const station = query.data;

  const churchColumns: Column<Church>[] = [
    {
      key: "name",
      header: t("church.name"),
      render: (row) => (
        <Link to={`/churches/${row.id}`} className="hover:underline">
          {row.name}
        </Link>
      ),
    },
    {
      key: "beneficiaries",
      header: t("church.beneficiaries"),
      numeric: true,
      render: (row) => number(row.beneficiary_count),
    },
  ];

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/stations" className="text-xs text-muted hover:underline">
            ← {t("station.title")}
          </Link>
          <h1 className="text-lg font-semibold">{station.name}</h1>
          <p className="text-xs text-muted">{station.company_name}</p>
        </div>
        {can("manage_stations") && (
          <Link to={`/stations/${station.id}/edit`} className="btn">
            {t("common.edit")}
          </Link>
        )}
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label={t("history.totalLevy")} value={usd(station.totals?.total_usd)} accent />
        <KpiCard label={t("history.transactions")} value={number(station.totals?.tx_count)} />
        <KpiCard label={t("station.churches")} value={number(station.churches?.length ?? 0)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title={t("station.title")}>
          <DetailRow label={t("station.code")} value={<span className="num">{station.code}</span>} />
          <DetailRow label={t("station.address")} value={orDash(station.address)} />
          <DetailRow label={t("station.latitude")} value={orDash(station.latitude)} />
          <DetailRow label={t("station.longitude")} value={orDash(station.longitude)} />
        </Card>

        <Card title={t("station.churches")} bodyClassName="">
          <DataTable
            columns={churchColumns}
            rows={station.churches}
            rowKey={(row) => row.id}
            emptyMessage={t("common.noResults")}
          />
        </Card>

        <Card title={t("station.collectedBy")} bodyClassName="">
          {history.data?.by_agent && history.data.by_agent.length > 0 ? (
            <table className="tbl tbl-zebra">
              <tbody>
                {history.data.by_agent.map((row) => (
                  <tr key={row.agent}>
                    <td>
                      <Link to={`/agents/${row.agent}`} className="hover:underline">
                        {row.username}
                      </Link>
                    </td>
                    <td className="num text-right">{number(row.count)}</td>
                    <td className="money num text-right">{usd(row.levy_usd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="px-4 py-8 text-center text-sm text-muted">{t("common.noResults")}</p>
          )}
        </Card>
      </div>

      <h2 className="text-sm font-semibold">{t("history.title")}</h2>
      <HistoryBlock
        data={history.data}
        isLoading={history.isLoading}
        isError={history.isError}
        onRetry={() => void history.refetch()}
        filters={values}
        setFilters={setFilters}
        page={page}
        setPage={setPage}
        hideStation
      />
    </div>
  );
}
