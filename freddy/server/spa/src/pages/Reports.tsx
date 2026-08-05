import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Bar, Doughnut } from "react-chartjs-2";

import { download } from "@/api/client";
import { useReports } from "@/api/hooks";
import { Card, ErrorState, KpiCard, Spinner } from "@/components/ui";
import { DataTable, type Column } from "@/components/DataTable";
import { barOptions, doughnutOptions, doughnutSegment, palette } from "@/charts/theme";
import { number, usd } from "@/lib/format";
import type { ReportsResponse } from "@/api/types";

type ChurchRow = ReportsResponse["church_summary"][number];
type MonthRow = ReportsResponse["monthly"][number];
type FuelRow = ReportsResponse["fuel_summary"][number];

export default function Reports() {
  const { t } = useTranslation();
  const query = useReports();

  if (query.isLoading) return <Spinner />;
  if (query.isError || !query.data) return <ErrorState onRetry={() => void query.refetch()} />;

  const { monthly, church_summary, fuel_summary, stats } = query.data;

  const monthColumns: Column<MonthRow>[] = [
    { key: "label", header: t("reports.month"), render: (row) => row.label },
    { key: "count", header: t("history.transactions"), numeric: true, render: (row) => number(row.count) },
    {
      key: "levy",
      header: t("tx.levyUsd"),
      numeric: true,
      render: (row) => <span className="money">{usd(row.levy)}</span>,
    },
  ];

  const churchColumns: Column<ChurchRow>[] = [
    {
      key: "church",
      header: t("disbursement.church"),
      render: (row) => (
        <Link to={`/churches/${row.church__id}`} className="font-medium hover:underline">
          {row.church__name}
        </Link>
      ),
    },
    { key: "station", header: t("tx.station"), render: (row) => row.church__station__name },
    { key: "company", header: t("tx.company"), render: (row) => row.church__station__company__name },
    { key: "count", header: t("history.transactions"), numeric: true, render: (row) => number(row.tx_count) },
    {
      key: "levy",
      header: t("tx.levyUsd"),
      numeric: true,
      render: (row) => <span className="money">{usd(row.total_levy)}</span>,
    },
  ];

  const fuelColumns: Column<FuelRow>[] = [
    { key: "fuel", header: t("tx.fuelType"), render: (row) => row.fuel_type__name },
    { key: "count", header: t("history.transactions"), numeric: true, render: (row) => number(row.count) },
    {
      key: "total",
      header: t("tx.levyUsd"),
      numeric: true,
      render: (row) => <span className="money">{usd(row.total)}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">{t("reports.title")}</h1>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn"
            onClick={() => void download("/transactions/export/excel/")}
          >
            {t("common.exportExcel")}
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => void download("/transactions/export/pdf/")}
          >
            {t("common.exportPdf")}
          </button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={t("dashboard.totalLevy")} value={usd(stats.total_levy)} accent />
        <KpiCard label={t("history.transactions")} value={number(stats.total_count)} />
        <KpiCard label={t("dashboard.disbursed")} value={usd(stats.total_disbursed)} />
        <KpiCard label={t("dashboard.pending")} value={number(stats.pending_count)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" title={t("reports.monthly")}>
          <div className="h-64">
            <Bar
              options={barOptions}
              data={{
                labels: monthly.map((row) => row.label),
                datasets: [
                  {
                    label: t("tx.levyUsd"),
                    data: monthly.map((row) => row.levy),
                    backgroundColor: palette[0],
                    borderRadius: 4,
                  },
                ],
              }}
            />
          </div>
        </Card>

        <Card title={t("reports.byFuel")}>
          <div className="h-64">
            <Doughnut
              options={doughnutOptions}
              data={{
                labels: fuel_summary.map((row) => row.fuel_type__name),
                datasets: [
                  {
                    data: fuel_summary.map((row) => row.total),
                    backgroundColor: palette,
                    ...doughnutSegment,
                  },
                ],
              }}
            />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title={t("reports.monthly")} bodyClassName="">
          <DataTable columns={monthColumns} rows={monthly} rowKey={(row) => row.label} />
        </Card>

        <Card className="lg:col-span-2" title={t("reports.byChurch")} bodyClassName="">
          <DataTable
            columns={churchColumns}
            rows={church_summary}
            rowKey={(row) => row.church__id}
          />
        </Card>
      </div>

      <Card title={t("reports.byFuel")} bodyClassName="">
        <DataTable columns={fuelColumns} rows={fuel_summary} rowKey={(row) => row.fuel_type__name} />
      </Card>
    </div>
  );
}
