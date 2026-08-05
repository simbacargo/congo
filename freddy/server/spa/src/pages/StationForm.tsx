import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { FormEvent } from "react";

import { useCompanies, useSave, useStation } from "@/api/hooks";
import type { Station } from "@/api/types";
import { CrudForm, formValues, useFieldErrors } from "@/components/CrudForm";
import { Field, Spinner } from "@/components/ui";
import { useToast } from "@/components/Toast";

export default function StationForm() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();

  const existing = useStation(id);
  const companies = useCompanies();
  const save = useSave<Station>("stations", id, ["stations", "station", "companies"], {
    onSuccess: () => {
      toast.success(id ? t("station.saved") : t("station.created"));
      navigate("/stations");
    },
  });
  const errors = useFieldErrors(save.error);

  if (id && existing.isLoading) return <Spinner />;
  const station = existing.data;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    save.mutate(formValues(event.currentTarget));
  }

  return (
    <CrudForm
      title={id ? t("station.editStation") : t("station.newStation")}
      onSubmit={onSubmit}
      busy={save.isPending}
      error={save.error}
      cancelTo="/stations"
    >
      <Field label={t("station.name")} htmlFor="name" required error={errors.name}>
        <input id="name" name="name" className="field" required defaultValue={station?.name} />
      </Field>

      <Field label={t("station.code")} htmlFor="code" required error={errors.code}>
        <input id="code" name="code" className="field" required defaultValue={station?.code} />
      </Field>

      <Field label={t("station.company")} htmlFor="company" required error={errors.company}>
        <select id="company" name="company" className="field" required defaultValue={station?.company ?? ""}>
          <option value="" disabled>
            —
          </option>
          {(companies.data?.results ?? []).map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label={t("station.address")} htmlFor="address" error={errors.address}>
        <textarea
          id="address"
          name="address"
          rows={3}
          className="field field-textarea"
          defaultValue={station?.address ?? ""}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("station.latitude")} htmlFor="latitude" error={errors.latitude}>
          <input
            id="latitude"
            name="latitude"
            type="number"
            step="0.000001"
            className="field"
            defaultValue={station?.latitude ?? ""}
          />
        </Field>
        <Field label={t("station.longitude")} htmlFor="longitude" error={errors.longitude}>
          <input
            id="longitude"
            name="longitude"
            type="number"
            step="0.000001"
            className="field"
            defaultValue={station?.longitude ?? ""}
          />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="is_active"
          className="check"
          defaultChecked={station?.is_active ?? true}
        />
        {t("common.active")}
      </label>
    </CrudForm>
  );
}
