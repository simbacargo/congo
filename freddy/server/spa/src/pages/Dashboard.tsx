import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { Link } from "react-router-dom";

import { request } from "@/api/client";
import type { ChartPoint, DashboardStats } from "@/api/types";
import { Card, EmptyState, ErrorState, KpiCard, Spinner, StatusBadge } from "@/components/ui";
import {
  accent,
  accentSoft,
  barOptions,
  lineOptions,
  doughnutOptions,
  doughnutSegment,
  palette,
  statusColors,
} from "@/charts/theme";
import { dateTime, number, percent, usd } from "@/lib/format";

const DAY_PRESETS = [7, 30, 90];

export default function Dashboard() {
  const { t } = useTranslation();
  const [days, setDays] = useState(30);

  const statsQuery = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: () => request<DashboardStats>("/dashboard/stats/"),
    // Matches the 20s htmx poll the Django dashboard uses.
    refetchInterval: 20_000,
  });

  const chartQuery = useQuery({
    queryKey: ["dashboard", "chart", days],
    queryFn: () => request<{ data: ChartPoint[] }>("/dashboard/chart/", { params: { days } }),
  });

  if (statsQuery.isLoading) return <Spinner />;
  if (statsQuery.isError) {
    return <ErrorState onRetry={() => void statsQuery.refetch()} />;
  }

  const stats = statsQuery.data!;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-lg font-semibold">{t("dashboard.title")}</h1>
        <p className="text-xs text-muted">{t("dashboard.subtitle")}</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={t("dashboard.todayLevy")}
          value={usd(stats.today_levy)}
          hint={`${number(stats.today_count)} ${t("dashboard.todayCount")}`}
          accent
        />
        <KpiCard
          label={t("dashboard.monthLevy")}
          value={usd(stats.month_levy)}
          hint={`${number(stats.month_count)} ${t("dashboard.monthCount")}`}
          accent
        />
        <KpiCard
          label={t("dashboard.totalLevy")}
          value={usd(stats.total_levy)}
          hint={`${number(stats.total_count)} ${t("dashboard.totalCount")}`}
          accent
        />
        <KpiCard
          label={t("dashboard.disbursed")}
          value={usd(stats.total_disbursed)}
          hint={`${number(stats.pending_disburse)} ${t("dashboard.pendingDisburse")}`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card
          className="lg:col-span-2"
          title={t("dashboard.trend")}
          actions={
            <div className="flex gap-1">
              {DAY_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={`btn ${days === preset ? "btn-primary" : "btn-quiet"}`}
                  onClick={() => setDays(preset)}
                >
                  {t("dashboard.days", { count: preset })}
                </button>
              ))}
            </div>
          }
        >
          <div className="h-64">
            {chartQuery.isLoading ? (
              <Spinner />
            ) : (
              <Line
                options={lineOptions}
                data={{
                  labels: chartQuery.data?.data.map((point) => point.date) ?? [],
                  datasets: [
                    {
                      label: t("tx.levy"),
                      data: chartQuery.data?.data.map((point) => point.amount) ?? [],
                      borderColor: accent,
                      backgroundColor: accentSoft,
                      fill: true,
                      tension: 0.35,
                      pointRadius: 0,
                      pointHoverRadius: 4,
                    },
                  ],
                }}
              />
            )}
          </div>
        </Card>

        <Card title={t("dashboard.byStatus")}>
          <div className="h-64">
            <Doughnut
              options={doughnutOptions}
              data={{
                labels: [
                  t("status.PENDING"),
                  t("status.VERIFIED"),
                  t("status.REMITTED"),
                ],
                datasets: [
                  {
                    data: [stats.pending_count, stats.verified_count, stats.remitted_count],
                    backgroundColor: [
                      statusColors.PENDING,
                      statusColors.VERIFIED,
                      statusColors.REMITTED,
                    ],
                    ...doughnutSegment,
                  },
                ],
              }}
            />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" title={t("dashboard.byCompany")}>
          <div className="h-56">
            <Bar
              options={barOptions}
              data={{
                labels: stats.by_company.map((row) => row.station__company__name),
                datasets: [
                  {
                    label: t("tx.levyUsd"),
                    data: stats.by_company.map((row) => row.total),
                    backgroundColor: palette[0],
                    borderRadius: 4,
                  },
                ],
              }}
            />
          </div>
        </Card>

        <Card title={t("dashboard.byFuel")}>
          <div className="h-56">
            <Doughnut
              options={doughnutOptions}
              data={{
                labels: stats.by_fuel.map((row) => row.fuel_type__name),
                datasets: [
                  {
                    data: stats.by_fuel.map((row) => row.total),
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
        <Card title={t("dashboard.topStations")}>
          {stats.top_stations.length === 0 ? (
            <EmptyState message={t("dashboard.noStations")} />
          ) : (
            <div className="space-y-3">
              {stats.top_stations.map((station) => (
                <div key={station.id}>
                  <div className="flex items-baseline justify-between gap-2">
                    <Link
                      to={`/stations/${station.id}`}
                      className="truncate text-sm font-medium hover:underline"
                    >
                      {station.name}
                    </Link>
                    <span className="money flex-shrink-0 text-xs">
                      {usd(station.month_levy)}
                    </span>
                  </div>
                  {station.target_pct !== null ? (
                    <>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
                        <div
                          className={`h-full rounded-full ${
                            station.target_pct >= 100 ? "bg-ok" : "bg-accent"
                          }`}
                          style={{ width: `${station.target_pct}%` }}
                        />
                      </div>
                      <p className="mt-0.5 text-[10px] text-muted">
                        {percent(station.target_pct)} {t("dashboard.ofTarget")}{" "}
                        {usd(station.target_usd, 0)}
                      </p>
                    </>
                  ) : (
                    <p className="mt-0.5 text-[10px] text-muted">
                      {station.company_name} · {t("dashboard.noTarget")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2" title={t("dashboard.recent")} bodyClassName="">
          {stats.recent.length === 0 ? (
            <EmptyState message={t("common.noResults")} />
          ) : (
            <div className="overflow-x-auto">
              <table className="tbl tbl-zebra">
                <thead>
                  <tr>
                    <th>{t("tx.receipt")}</th>
                    <th>{t("tx.station")}</th>
                    <th>{t("tx.levyUsd")}</th>
                    <th>{t("common.status")}</th>
                    <th>{t("common.date")}</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent.map((tx) => (
                    <tr key={tx.id}>
                      <td>
                        <Link
                          to={`/transactions/${tx.id}`}
                          className="receipt-code hover:underline"
                        >
                          {tx.receipt_code}
                        </Link>
                      </td>
                      <td className="truncate">{tx.station_name}</td>
                      <td className="money num">{usd(tx.levy_amount_usd)}</td>
                      <td>
                        <StatusBadge status={tx.status} />
                      </td>
                      <td className="whitespace-nowrap text-xs text-muted">
                        {dateTime(tx.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
