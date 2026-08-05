import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { FormEvent } from "react";

import { useChurch, useSave, useStations } from "@/api/hooks";
import type { Church } from "@/api/types";
import { CrudForm, formValues, useFieldErrors } from "@/components/CrudForm";
import { Field, Spinner } from "@/components/ui";
import { useToast } from "@/components/Toast";

export default function ChurchForm() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();

  const existing = useChurch(id);
  const stations = useStations();
  const save = useSave<Church>("churches", id, ["churches", "church", "stations"], {
    onSuccess: () => {
      toast.success(id ? t("church.saved") : t("church.created"));
      navigate("/churches");
    },
  });
  const errors = useFieldErrors(save.error);

  if (id && existing.isLoading) return <Spinner />;
  const church = existing.data;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    save.mutate(formValues(event.currentTarget));
  }

  return (
    <CrudForm
      title={id ? t("church.editChurch") : t("church.newChurch")}
      onSubmit={onSubmit}
      busy={save.isPending}
      error={save.error}
      cancelTo="/churches"
    >
      <Field label={t("church.name")} htmlFor="name" required error={errors.name}>
        <input id="name" name="name" className="field" required defaultValue={church?.name} />
      </Field>

      <Field label={t("church.station")} htmlFor="station" required error={errors.station}>
        <select id="station" name="station" className="field" required defaultValue={church?.station ?? ""}>
          <option value="" disabled>
            —
          </option>
          {(stations.data?.results ?? []).map((station) => (
            <option key={station.id} value={station.id}>
              {station.company_name} — {station.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label={t("church.contactPerson")} htmlFor="contact_person" error={errors.contact_person}>
        <input
          id="contact_person"
          name="contact_person"
          className="field"
          defaultValue={church?.contact_person ?? ""}
        />
      </Field>

      <Field label={t("church.contactPhone")} htmlFor="contact_phone" error={errors.contact_phone}>
        <input
          id="contact_phone"
          name="contact_phone"
          className="field"
          defaultValue={church?.contact_phone ?? ""}
        />
      </Field>

      <Field
        label={t("church.beneficiaries")}
        htmlFor="beneficiary_count"
        error={errors.beneficiary_count}
      >
        <input
          id="beneficiary_count"
          name="beneficiary_count"
          type="number"
          min="0"
          className="field"
          defaultValue={church?.beneficiary_count ?? 0}
        />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="is_active"
          className="check"
          defaultChecked={church?.is_active ?? true}
        />
        {t("common.active")}
      </label>
    </CrudForm>
  );
}
