import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { FormEvent } from "react";

import { useChurches, useDisbursement, useSave } from "@/api/hooks";
import type { Disbursement } from "@/api/types";
import { CrudForm, formValues, useFieldErrors } from "@/components/CrudForm";
import { Field, Spinner } from "@/components/ui";
import { useToast } from "@/components/Toast";

const STATUSES = ["SCHEDULED", "PAID", "CANCELLED"];

export default function DisbursementForm() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();

  const existing = useDisbursement(id);
  const churches = useChurches();
  const save = useSave<Disbursement>("disbursements", id, ["disbursements", "church"], {
    onSuccess: () => {
      toast.success(id ? t("disbursement.saved") : t("disbursement.created"));
      navigate("/disbursements");
    },
  });
  const errors = useFieldErrors(save.error);

  if (id && existing.isLoading) return <Spinner />;
  const disbursement = existing.data;

  // Lets the church detail page deep-link "+ Disbursement" with the church
  // pre-selected — the Django template linked this way but the view ignored it.
  const presetChurch = searchParams.get("church") ?? "";

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    save.mutate(formValues(event.currentTarget));
  }

  return (
    <CrudForm
      title={id ? t("disbursement.editDisbursement") : t("disbursement.newDisbursement")}
      onSubmit={onSubmit}
      busy={save.isPending}
      error={save.error}
      cancelTo="/disbursements"
    >
      <Field label={t("disbursement.church")} htmlFor="church" required error={errors.church}>
        <select
          id="church"
          name="church"
          className="field"
          required
          defaultValue={disbursement?.church ?? presetChurch}
        >
          <option value="" disabled>
            —
          </option>
          {(churches.data?.results ?? []).map((church) => (
            <option key={church.id} value={church.id}>
              {church.name} — {church.station_name}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t("disbursement.periodStart")}
          htmlFor="period_start"
          required
          error={errors.period_start}
        >
          <input
            id="period_start"
            name="period_start"
            type="date"
            className="field"
            required
            defaultValue={disbursement?.period_start}
          />
        </Field>
        <Field
          label={t("disbursement.periodEnd")}
          htmlFor="period_end"
          required
          error={errors.period_end}
        >
          <input
            id="period_end"
            name="period_end"
            type="date"
            className="field"
            required
            defaultValue={disbursement?.period_end}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t("disbursement.amountUsd")}
          htmlFor="amount_usd"
          required
          error={errors.amount_usd}
        >
          <input
            id="amount_usd"
            name="amount_usd"
            type="number"
            step="0.01"
            min="0"
            className="field"
            required
            defaultValue={disbursement?.amount_usd}
          />
        </Field>
        <Field label={t("disbursement.amountCdf")} htmlFor="amount_cdf" error={errors.amount_cdf}>
          <input
            id="amount_cdf"
            name="amount_cdf"
            type="number"
            step="0.01"
            min="0"
            className="field"
            defaultValue={disbursement?.amount_cdf ?? "0"}
          />
        </Field>
      </div>

      <Field
        label={t("disbursement.paymentMethod")}
        htmlFor="payment_method"
        error={errors.payment_method}
      >
        <input
          id="payment_method"
          name="payment_method"
          className="field"
          defaultValue={disbursement?.payment_method ?? ""}
        />
      </Field>

      <Field label={t("common.status")} htmlFor="status" error={errors.status}>
        <select
          id="status"
          name="status"
          className="field"
          defaultValue={disbursement?.status ?? "SCHEDULED"}
        >
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {t(`status.${status}`)}
            </option>
          ))}
        </select>
      </Field>

      <Field label={t("common.notes")} htmlFor="notes" error={errors.notes}>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className="field field-textarea"
          defaultValue={disbursement?.notes ?? ""}
        />
      </Field>
    </CrudForm>
  );
}
