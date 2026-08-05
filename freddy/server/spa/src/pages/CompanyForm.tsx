import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { FormEvent } from "react";

import { useCompany, useSave } from "@/api/hooks";
import type { Company } from "@/api/types";
import { CrudForm, useFieldErrors } from "@/components/CrudForm";
import { Field, Spinner } from "@/components/ui";
import { useToast } from "@/components/Toast";

export default function CompanyForm() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();

  const existing = useCompany(id);
  const save = useSave<Company>("companies", id, ["companies", "company"], {
    onSuccess: () => {
      toast.success(id ? t("company.saved") : t("company.created"));
      navigate("/companies");
    },
  });
  const errors = useFieldErrors(save.error);

  if (id && existing.isLoading) return <Spinner />;
  const company = existing.data;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Multipart throughout: the logo is an ImageField, and a mixed
    // JSON/file payload isn't expressible in one request.
    const data = new FormData(event.currentTarget);
    const logo = data.get("logo");
    if (logo instanceof File && logo.size === 0) data.delete("logo");
    data.set("is_active", String(event.currentTarget.is_active.checked));
    save.mutate(data);
  }

  return (
    <CrudForm
      title={id ? t("company.editCompany") : t("company.newCompany")}
      onSubmit={onSubmit}
      busy={save.isPending}
      error={save.error}
      cancelTo="/companies"
      multipart
    >
      <Field label={t("company.name")} htmlFor="name" required error={errors.name}>
        <input id="name" name="name" className="field" required defaultValue={company?.name} />
      </Field>

      <Field label={t("company.code")} htmlFor="code" required error={errors.code}>
        <input id="code" name="code" className="field" required defaultValue={company?.code} />
      </Field>

      <Field label={t("company.email")} htmlFor="contact_email" error={errors.contact_email}>
        <input
          id="contact_email"
          name="contact_email"
          type="email"
          className="field"
          defaultValue={company?.contact_email ?? ""}
        />
      </Field>

      <Field label={t("company.phone")} htmlFor="contact_phone" error={errors.contact_phone}>
        <input
          id="contact_phone"
          name="contact_phone"
          className="field"
          defaultValue={company?.contact_phone ?? ""}
        />
      </Field>

      <Field label={t("company.logo")} htmlFor="logo" error={errors.logo}>
        <input id="logo" name="logo" type="file" accept="image/*" className="field" />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="is_active"
          className="check"
          defaultChecked={company?.is_active ?? true}
        />
        {t("common.active")}
      </label>
    </CrudForm>
  );
}
