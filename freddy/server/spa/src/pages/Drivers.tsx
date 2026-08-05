import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Bar, Doughnut } from "react-chartjs-2";

import { download } from "@/api/client";
import { useDrivers } from "@/api/hooks";
import type { DriverListRow } from "@/api/types";
import { Card, KpiCard, Pagination } from "@/components/ui";
import { DataTable, type Column } from "@/components/DataTable";
import { FilterBar, FilterSelect } from "@/components/FilterBar";
import {
  barOptions,
  doughnutOptions,
  doughnutSegment,
  horizontalBarOptions,
  palette,
} from "@/charts/theme";
import { useDebounced } from "@/lib/useDebounced";
import { useFilters, toParams } from "@/lib/useFilters";
import { date, number, orDash, percent } from "@/lib/format";

const PAGE_SIZE = 50;

/** Column key → the `?sort=` token the API's DRIVER_SORTABLE map accepts. */
const SORTABLE: Record<string, string> = {
  name: "name",
  commune: "commune",
  vehicle: "vehicle",
  fuel: "fuel",
  consumption: "consumption",
  agent: "agent",
  registered: "registered",
};

export default function Drivers() {
  const { t } = useTranslation();
  const { values, setFilters, clear, page, setPage, active } = useFilters();

  const [search, setSearch] = useState(values.q ?? "");
  const debouncedSearch = useDebounced(search);
  useEffect(() => {
    if (debouncedSearch !== (values.q ?? "")) setFilters({ q: debouncedSearch });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const query = useDrivers({ ...toParams(values), page });
  const data = query.data;

  const sort = data?.sort ?? "name";
  const direction = data?.dir ?? "asc";

  function toggleSort(key: string) {
    const token = SORTABLE[key];
    if (!token) return;
    setFilters({
      sort: token,
      dir: sort === token && direction === "asc" ? "desc" : "asc",
    });
  }

  /** Header that carries the current sort direction, like `_sort_th.html`. */
  function SortHeader({ label, columnKey }: { label: string; columnKey: string }) {
    const token = SORTABLE[columnKey];
    const isActive = sort === token;
    return (
      <button
        type="button"
        onClick={() => toggleSort(columnKey)}
        className="flex items-center gap-1 hover:underline"
      >
        {label}
        <span className={isActive ? "" : "opacity-30"}>
          {isActive ? (direction === "asc" ? "↑" : "↓") : "↕"}
        </span>
      </button>
    );
  }

  const columns: Column<DriverListRow>[] = [
    {
      key: "name",
      header: <SortHeader label={t("driver.name")} columnKey="name" />,
      render: (row) => (
        <Link to={`/drivers/${row.id}`} className="font-medium hover:underline">
          {orDash(row.full_name)}
        </Link>
      ),
    },
    {
      key: "phone",
      header: t("driver.phone"),
      render: (row) =>
        row.phone ? (
          <a href={`tel:${row.phone}`} className="num hover:underline">
            {row.phone}
          </a>
        ) : (
          "—"
        ),
    },
    {
      key: "commune",
      header: <SortHeader label={t("driver.commune")} columnKey="commune" />,
      render: (row) => orDash(row.commune),
    },
    { key: "quartier", header: t("driver.quartier"), render: (row) => orDash(row.quartier) },
    {
      key: "vehicle",
      header: <SortHeader label={t("driver.vehicleType")} columnKey="vehicle" />,
      render: (row) => orDash(row.vehicle_type),
    },
    {
      key: "fuel",
      header: <SortHeader label={t("driver.fuelType")} columnKey="fuel" />,
      render: (row) => orDash(row.fuel_type),
    },
    {
      key: "consumption",
      header: <SortHeader label={t("driver.consumption")} columnKey="consumption" />,
      render: (row) => orDash(row.daily_fuel_consumption),
    },
    {
      key: "health",
      header: t("driver.healthCoverage"),
      render: (row) =>
        row.has_health_coverage === null ? (
          <span className="badge badge-SCHEDULED">{t("common.unknown")}</span>
        ) : (
          <span className={`badge ${row.has_health_coverage ? "badge-VERIFIED" : "badge-CANCELLED"}`}>
            {row.has_health_coverage ? t("common.yes") : t("common.no")}
          </span>
        ),
    },
    {
      key: "agent",
      header: <SortHeader label={t("driver.fieldAgent")} columnKey="agent" />,
      render: (row) => orDash(row.field_agent),
    },
    {
      key: "registered",
      header: <SortHeader label={t("driver.registered")} columnKey="registered" />,
      render: (row) => <span className="text-xs text-muted">{date(row.registration_date)}</span>,
    },
  ];

  const kpi = data?.kpi;
  const charts = data?.charts;
  const options = data?.filter_options;
  const numPages = Math.max(1, Math.ceil((data?.count ?? 0) / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">{t("driver.title")}</h1>
        <button
          type="button"
          className="btn"
          onClick={() => void download("/drivers/export/excel/", toParams(values))}
        >
          {t("common.exportExcel")}
        </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label={t("driver.filtered")} value={number(kpi?.filtered)} />
        <KpiCard label={t("driver.totalDrivers")} value={number(kpi?.total)} />
        <KpiCard
          label={t("driver.topVehicle")}
          value={<span className="text-base">{orDash(kpi?.top_vehicle)}</span>}
          hint={number(kpi?.top_vehicle_n)}
        />
        <KpiCard label={t("driver.coverage")} value={percent(kpi?.coverage_pct)} />
        <KpiCard label={t("driver.fieldAgents")} value={number(kpi?.agents)} />
      </div>

      <FilterBar
        active={active.filter(([key]) => !["q", "sort", "dir"].includes(key)) as [string, string][]}
        labels={{
          commune: t("driver.commune"),
          vehicle_type: t("driver.vehicleType"),
          fuel_type: t("driver.fuelType"),
          agent: t("driver.fieldAgent"),
        }}
        onRemove={(key) => setFilters({ [key]: "" })}
        onClear={() => {
          setSearch("");
          clear();
        }}
      >
        <input
          className="field lg:col-span-2"
          placeholder={t("driver.searchPlaceholder")}
          aria-label={t("common.search")}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <FilterSelect
          value={values.commune ?? ""}
          onChange={(value) => setFilters({ commune: value })}
          options={(options?.communes ?? []).map((v) => ({ value: v, label: v }))}
          placeholder={t("driver.allCommunes")}
        />
        <FilterSelect
          value={values.vehicle_type ?? ""}
          onChange={(value) => setFilters({ vehicle_type: value })}
          options={(options?.vehicle_types ?? []).map((v) => ({ value: v, label: v }))}
          placeholder={t("driver.allVehicles")}
        />
        <FilterSelect
          value={values.fuel_type ?? ""}
          onChange={(value) => setFilters({ fuel_type: value })}
          options={(options?.fuel_types ?? []).map((v) => ({ value: v, label: v }))}
          placeholder={t("driver.allFuels")}
        />
        <FilterSelect
          value={values.agent ?? ""}
          onChange={(value) => setFilters({ agent: value })}
          options={(options?.agents ?? []).map((v) => ({ value: v, label: v }))}
          placeholder={t("driver.allAgents")}
        />
      </FilterBar>

      {charts && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card title={t("driver.byCommune")}>
            <div className="h-48">
              <Bar
                options={barOptions}
                data={{
                  labels: charts.commune.map(([label]) => label),
                  datasets: [
                    {
                      label: t("driver.title"),
                      data: charts.commune.map(([, count]) => count),
                      backgroundColor: palette[0],
                      borderRadius: 4,
                    },
                  ],
                }}
              />
            </div>
          </Card>

          <Card title={t("driver.byVehicle")}>
            <div className="h-48">
              <Doughnut
                options={doughnutOptions}
                data={{
                  labels: charts.vehicle.map(([label]) => label),
                  datasets: [
                    {
                      data: charts.vehicle.map(([, count]) => count),
                      backgroundColor: palette,
                      ...doughnutSegment,
                    },
                  ],
                }}
              />
            </div>
          </Card>

          <Card title={t("driver.byConsumption")}>
            <div className="h-48">
              <Bar
                options={barOptions}
                data={{
                  labels: charts.consumption.map(([label]) => label),
                  datasets: [
                    {
                      label: t("driver.consumption"),
                      data: charts.consumption.map(([, count]) => count),
                      backgroundColor: palette[1],
                      borderRadius: 4,
                    },
                  ],
                }}
              />
            </div>
          </Card>

          <Card title={t("driver.byHealth")}>
            <div className="h-48">
              <Bar
                options={horizontalBarOptions}
                data={{
                  labels: [t("common.yes"), t("common.no"), t("common.unknown")],
                  datasets: [
                    {
                      label: t("driver.healthCoverage"),
                      data: charts.health,
                      backgroundColor: [palette[3], palette[5], palette[2]],
                      borderRadius: 4,
                    },
                  ],
                }}
              />
            </div>
          </Card>
        </div>
      )}

      <Card bodyClassName="">
        <div className="max-h-[60vh] overflow-auto">
          <DataTable
            columns={columns}
            rows={data?.results}
            rowKey={(row) => row.id}
            isLoading={query.isLoading}
            isError={query.isError}
            onRetry={() => void query.refetch()}
            sticky
          />
        </div>
        <Pagination page={page} numPages={numPages} onChange={setPage} />
      </Card>
    </div>
  );
}
