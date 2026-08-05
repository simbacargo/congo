import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";

import { ApiError, request } from "@/api/client";
import { Card, DetailRow, Spinner } from "@/components/ui";
import { dateTime, usd } from "@/lib/format";

interface VerifyResult {
  receipt_code: string;
  station: string;
  company: string;
  church: string;
  amount_usd: string;
  levy_usd: string;
  status: string;
  created_at: string;
  valid: boolean;
}

/**
 * Receipt lookup. The endpoint is `AllowAny`, so this page also works signed
 * out — a driver holding a printed receipt can check it without an account.
 */
export default function Verify() {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const [code, setCode] = useState("");

  const query = useQuery({
    queryKey: ["verify", code],
    queryFn: () => request<VerifyResult>(`/verify/${encodeURIComponent(code)}/`),
    enabled: code.length > 0,
    retry: false,
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setCode(input.trim().toUpperCase());
  }

  const notFound = query.error instanceof ApiError && query.error.status === 404;

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <header>
        <h1 className="text-lg font-semibold">{t("verify.title")}</h1>
      </header>

      <form onSubmit={onSubmit} className="card flex gap-2 p-3">
        <input
          className="field flex-1"
          placeholder={t("verify.placeholder")}
          aria-label={t("verify.title")}
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />
        <button type="submit" className="btn btn-primary">
          {t("verify.check")}
        </button>
      </form>

      {query.isFetching && <Spinner />}

      {notFound && (
        <div className="alert alert-error" role="alert">
          <strong>{t("verify.invalid")}</strong>
          <p className="text-xs">{t("verify.invalidHint")}</p>
        </div>
      )}

      {query.data?.valid && (
        <Card title={t("verify.valid")}>
          <DetailRow
            label={t("tx.receipt")}
            value={<span className="receipt-code">{query.data.receipt_code}</span>}
          />
          <DetailRow label={t("tx.company")} value={query.data.company} />
          <DetailRow label={t("tx.station")} value={query.data.station} />
          <DetailRow label={t("tx.church")} value={query.data.church} />
          <DetailRow label={t("tx.amountUsd")} value={usd(query.data.amount_usd)} />
          <DetailRow
            label={t("tx.levyUsd")}
            value={<span className="money">{usd(query.data.levy_usd, 4)}</span>}
          />
          <DetailRow label={t("common.status")} value={t(`status.${query.data.status}`)} />
          <DetailRow label={t("common.date")} value={dateTime(query.data.created_at)} />
        </Card>
      )}
    </div>
  );
}
