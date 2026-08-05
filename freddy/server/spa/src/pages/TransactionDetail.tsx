import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useTransaction, useUpdateTransaction } from "@/api/hooks";
import { useAuth } from "@/auth/AuthProvider";
import { Card, DetailRow, ErrorState, Spinner, StatusBadge } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { cdf, dateTime, number, orDash, usd } from "@/lib/format";

const STATUSES = ["PENDING", "VERIFIED", "REMITTED"];

export default function TransactionDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { can } = useAuth();
  const toast = useToast();

  const query = useTransaction(id);
  const update = useUpdateTransaction(id!);
  const [status, setStatus] = useState<string | null>(null);
  const [notes, setNotes] = useState<string | null>(null);

  if (query.isLoading) return <Spinner />;
  if (query.isError || !query.data) {
    return <ErrorState onRetry={() => void query.refetch()} />;
  }

  const tx = query.data;
  const editable = can("update_transaction_status");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      await update.mutateAsync({
        status: status ?? tx.status,
        notes: notes ?? tx.notes ?? "",
      });
      toast.success(t("tx.updated", { code: tx.receipt_code }));
      setStatus(null);
      setNotes(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.error"));
    }
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/transactions" className="text-xs text-muted hover:underline">
            ← {t("tx.title")}
          </Link>
          <h1 className="receipt-code text-lg font-semibold">{tx.receipt_code}</h1>
        </div>
        <StatusBadge status={tx.status} />
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" title={t("tx.detailTitle")}>
          <div className="grid gap-x-8 sm:grid-cols-2">
            <DetailRow label={t("tx.company")} value={tx.company_name} />
            <DetailRow
              label={t("tx.station")}
              value={
                <Link to={`/stations/${tx.station}`} className="hover:underline">
                  {tx.station_name}
                </Link>
              }
            />
            <DetailRow
              label={t("tx.church")}
              value={
                <Link to={`/churches/${tx.church}`} className="hover:underline">
                  {tx.church_name}
                </Link>
              }
            />
            <DetailRow
              label={t("tx.agent")}
              value={
                <Link to={`/agents/${tx.agent}`} className="hover:underline">
                  {tx.agent_username}
                </Link>
              }
            />
            <DetailRow label={t("tx.fuelType")} value={tx.fuel_type_name} />
            <DetailRow label={t("tx.currency")} value={tx.currency_used} />
            <DetailRow label={t("tx.amountUsd")} value={usd(tx.amount_usd)} />
            <DetailRow label={t("tx.amountCdf")} value={cdf(tx.amount_cdf)} />
            <DetailRow
              label={t("tx.levyUsd")}
              value={<span className="money">{usd(tx.levy_amount_usd, 4)}</span>}
            />
            <DetailRow label={t("tx.levyCdf")} value={cdf(tx.levy_amount_cdf)} />
            <DetailRow label={t("tx.exchangeRate")} value={number(tx.exchange_rate)} />
            <DetailRow label={t("tx.driverPhone")} value={orDash(tx.driver_phone)} />
            <DetailRow label={t("common.date")} value={dateTime(tx.created_at)} />
            <DetailRow label={t("common.notes")} value={orDash(tx.notes)} />
          </div>
        </Card>

        {editable && (
          <Card title={t("common.status")}>
            <form onSubmit={onSubmit} className="space-y-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="status" className="text-xs font-medium">
                  {t("common.status")}
                </label>
                <select
                  id="status"
                  className="field"
                  value={status ?? tx.status}
                  onChange={(event) => setStatus(event.target.value)}
                >
                  {STATUSES.map((option) => (
                    <option key={option} value={option}>
                      {t(`status.${option}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="notes" className="text-xs font-medium">
                  {t("common.notes")}
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  className="field field-textarea"
                  value={notes ?? tx.notes ?? ""}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={update.isPending}
              >
                {update.isPending ? t("common.saving") : t("common.save")}
              </button>
            </form>
          </Card>
        )}
      </div>

      <Card title={t("tx.auditTrail")} bodyClassName="">
        {tx.audit_logs.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted">{t("tx.noAudit")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="tbl tbl-zebra">
              <thead>
                <tr>
                  <th>{t("tx.field")}</th>
                  <th>{t("tx.oldValue")}</th>
                  <th>{t("tx.newValue")}</th>
                  <th>{t("tx.changedBy")}</th>
                  <th>{t("tx.changedAt")}</th>
                  <th>{t("audit.ip")}</th>
                </tr>
              </thead>
              <tbody>
                {tx.audit_logs.map((log) => (
                  <tr key={log.id}>
                    <td className="font-medium">{log.field_name}</td>
                    <td>
                      <span className="badge badge-CANCELLED">{orDash(log.old_value)}</span>
                    </td>
                    <td>
                      <span className="badge badge-VERIFIED">{orDash(log.new_value)}</span>
                    </td>
                    <td>{orDash(log.changed_by_username)}</td>
                    <td className="whitespace-nowrap text-xs text-muted">
                      {dateTime(log.changed_at)}
                    </td>
                    <td className="num text-xs text-muted">{orDash(log.ip_address)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
