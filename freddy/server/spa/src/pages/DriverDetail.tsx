import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useDriver } from "@/api/hooks";
import type { Transaction } from "@/api/types";
import { Card, DetailRow, ErrorState, KpiCard, Spinner, StatusBadge } from "@/components/ui";
import { DataTable, type Column } from "@/components/DataTable";
import { date, dateTime, number, orDash, usd } from "@/lib/format";

export default function DriverDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const query = useDriver(id);

  if (query.isLoading) return <Spinner />;
  if (query.isError || !query.data) return <ErrorState onRetry={() => void query.refetch()} />;

  const { driver, qr_code, summary, transactions } = query.data;

  function yesNo(value: boolean | null | undefined) {
    if (value === null || value === undefined) return t("common.unknown");
    return value ? t("common.yes") : t("common.no");
  }

  const columns: Column<Transaction>[] = [
    {
      key: "receipt",
      header: t("tx.receipt"),
      render: (row) => (
        <Link to={`/transactions/${row.id}`} className="receipt-code hover:underline">
          {row.receipt_code}
        </Link>
      ),
    },
    { key: "station", header: t("tx.station"), render: (row) => row.station_name },
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

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/drivers" className="text-xs text-muted hover:underline">
            ← {t("driver.title")}
          </Link>
          <h1 className="text-lg font-semibold">{orDash(driver.full_name)}</h1>
          <p className="text-xs text-muted">{t("driver.profile")}</p>
        </div>
        {/* The ID card stays server-rendered: it embeds a QR, a Code128
            barcode and base64 logos in a print stylesheet. */}
        <a
          href={`/drivers/${driver.id}/id-card/`}
          target="_blank"
          rel="noreferrer"
          className="btn btn-primary"
        >
          {t("driver.idCard")}
        </a>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label={t("driver.levyHistory")} value={usd(summary.total_levy_usd)} accent />
        <KpiCard label={t("history.transactions")} value={number(summary.count)} />
        <KpiCard label={t("history.totalAmount")} value={usd(summary.total_amount_usd)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card title={t("driver.contact")}>
          <DetailRow
            label={t("driver.phone")}
            value={
              driver.phone ? (
                <a href={`tel:${driver.phone}`} className="num hover:underline">
                  {driver.phone}
                </a>
              ) : (
                "—"
              )
            }
          />
          <DetailRow label={t("driver.email")} value={orDash(driver.email)} />
          <DetailRow label={t("driver.gender")} value={orDash(driver.gender)} />
          <DetailRow label={t("driver.maritalStatus")} value={orDash(driver.marital_status)} />
        </Card>

        <Card title={t("driver.location")}>
          <DetailRow label={t("driver.commune")} value={orDash(driver.commune)} />
          <DetailRow label={t("driver.quartier")} value={orDash(driver.quartier)} />
          <DetailRow label={t("driver.cityCountry")} value={orDash(driver.city_country)} />
        </Card>

        <Card title={t("driver.vehicle")}>
          <DetailRow label={t("driver.vehicleType")} value={orDash(driver.vehicle_type)} />
          <DetailRow label={t("driver.vehicleColor")} value={orDash(driver.vehicle_color)} />
          <DetailRow label={t("driver.fuelType")} value={orDash(driver.fuel_type)} />
          <DetailRow label={t("driver.consumption")} value={orDash(driver.daily_fuel_consumption)} />
        </Card>

        <Card title={t("driver.health")}>
          <DetailRow label={t("driver.healthCoverage")} value={yesNo(driver.has_health_coverage)} />
          <DetailRow
            label={t("driver.careDifficulty")}
            value={yesNo(driver.has_care_access_difficulty)}
          />
          <DetailRow label={t("driver.dependents")} value={orDash(driver.dependents)} />
        </Card>

        <Card title={t("driver.registration")}>
          <DetailRow label={t("driver.fieldAgent")} value={orDash(driver.field_agent)} />
          <DetailRow label={t("driver.registered")} value={date(driver.registration_date)} />
          <DetailRow label="Consent" value={yesNo(driver.consent)} />
        </Card>

        <Card title={t("driver.qrCode")}>
          <div className="flex justify-center">
            <img src={qr_code} alt={t("driver.qrCode")} className="h-40 w-40" />
          </div>
        </Card>
      </div>

      <Card title={t("driver.levyHistory")} bodyClassName="">
        <DataTable
          columns={columns}
          rows={transactions}
          rowKey={(row) => row.id}
          emptyMessage={t("history.empty")}
        />
      </Card>
    </div>
  );
}
