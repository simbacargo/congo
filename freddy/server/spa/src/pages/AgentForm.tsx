import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { FormEvent } from "react";

import { useAgent, useCompanies, useSave, useStations } from "@/api/hooks";
import type { Agent } from "@/api/types";
import { CrudForm, formValues, useFieldErrors } from "@/components/CrudForm";
import { Field, Spinner } from "@/components/ui";
import { useToast } from "@/components/Toast";

const ROLES = ["NGO_ADMIN", "COMPANY_MANAGER", "STATION_AGENT"];

export default function AgentForm() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();

  const existing = useAgent(id);
  const stations = useStations();
  const companies = useCompanies();
  const save = useSave<Agent>("agents", id, ["agents", "agent"], {
    onSuccess: () => {
      toast.success(id ? t("agent.saved") : t("agent.created"));
      navigate("/agents");
    },
  });
  const errors = useFieldErrors(save.error);

  if (id && existing.isLoading) return <Spinner />;
  const agent = existing.data;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = formValues(event.currentTarget);
    // A blank password means "leave it alone"; sending "" would be rejected
    // by the serializer's own blank check on create.
    if (!body.password) delete body.password;
    save.mutate(body);
  }

  return (
    <CrudForm
      title={id ? t("agent.editAgent") : t("agent.newAgent")}
      onSubmit={onSubmit}
      busy={save.isPending}
      error={save.error}
      cancelTo="/agents"
    >
      <Field label={t("agent.username")} htmlFor="username" required error={errors.username}>
        <input id="username" name="username" className="field" required defaultValue={agent?.username} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("agent.firstname")} htmlFor="firstname" error={errors.firstname}>
          <input id="firstname" name="firstname" className="field" defaultValue={agent?.firstname ?? ""} />
        </Field>
        <Field label={t("agent.lastname")} htmlFor="lastname" error={errors.lastname}>
          <input id="lastname" name="lastname" className="field" defaultValue={agent?.lastname ?? ""} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("agent.email")} htmlFor="email" error={errors.email}>
          <input id="email" name="email" type="email" className="field" defaultValue={agent?.email ?? ""} />
        </Field>
        <Field label={t("agent.mobile")} htmlFor="mobile" error={errors.mobile}>
          <input id="mobile" name="mobile" className="field" defaultValue={agent?.mobile ?? ""} />
        </Field>
      </div>

      <Field label={t("agent.role")} htmlFor="role" required error={errors.role}>
        <select id="role" name="role" className="field" required defaultValue={agent?.role ?? "STATION_AGENT"}>
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {t(`role.${role}`)}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label={t("agent.assignedStation")}
        htmlFor="assigned_station"
        error={errors.assigned_station}
      >
        <select
          id="assigned_station"
          name="assigned_station"
          className="field"
          defaultValue={agent?.assigned_station ?? ""}
        >
          <option value="">{t("common.none")}</option>
          {(stations.data?.results ?? []).map((station) => (
            <option key={station.id} value={station.id}>
              {station.company_name} — {station.name}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label={t("agent.managedCompany")}
        htmlFor="managed_company"
        error={errors.managed_company}
      >
        <select
          id="managed_company"
          name="managed_company"
          className="field"
          defaultValue={agent?.managed_company ?? ""}
        >
          <option value="">{t("common.none")}</option>
          {(companies.data?.results ?? []).map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label={t("agent.password")}
        htmlFor="password"
        hint={t("agent.passwordHint")}
        error={errors.password}
      >
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          className="field"
        />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="is_active"
          className="check"
          defaultChecked={agent?.is_active ?? true}
        />
        {t("common.active")}
      </label>
    </CrudForm>
  );
}
