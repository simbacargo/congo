import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

import { useFuelTypes, useSave } from "@/api/hooks";
import type { FuelType } from "@/api/types";
import { Card, Field } from "@/components/ui";
import { DataTable, type Column } from "@/components/DataTable";
import { useFieldErrors } from "@/components/CrudForm";
import { useToast } from "@/components/Toast";

/**
 * Fuel types are a short, rarely-changed list, so the list and its form sit
 * side by side rather than on separate routes — the same two-column layout the
 * Django settings page used.
 */
export default function FuelTypes() {
  const { t } = useTranslation();
  const toast = useToast();
  const query = useFuelTypes();
  const [editing, setEditing] = useState<FuelType | null>(null);

  const save = useSave<FuelType>("fuel-types", editing?.id, ["fuel-types"], {
    onSuccess: () => {
      toast.success(editing ? t("fuelType.saved") : t("fuelType.created"));
      setEditing(null);
    },
  });
  const errors = useFieldErrors(save.error);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    save.mutate(
      {
        name: data.get("name"),
        code: data.get("code"),
        is_active: (form.elements.namedItem("is_active") as HTMLInputElement).checked,
      },
      { onSuccess: () => form.reset() },
    );
  }

  const columns: Column<FuelType>[] = [
    { key: "name", header: t("fuelType.name"), render: (row) => <span className="font-medium">{row.name}</span> },
    { key: "code", header: t("fuelType.code"), render: (row) => <span className="num">{row.code}</span> },
    {
      key: "active",
      header: t("common.status"),
      render: (row) => (
        <span className={`badge ${row.is_active ? "badge-VERIFIED" : "badge-CANCELLED"}`}>
          {row.is_active ? t("common.active") : t("common.inactive")}
        </span>
      ),
    },
    {
      key: "actions",
      header: t("common.actions"),
      render: (row) => (
        <button type="button" className="btn btn-quiet" onClick={() => setEditing(row)}>
          {t("common.edit")}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-lg font-semibold">{t("fuelType.title")}</h1>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" title={t("fuelType.title")} bodyClassName="">
          <DataTable
            columns={columns}
            rows={query.data}
            rowKey={(row) => row.id}
            isLoading={query.isLoading}
            isError={query.isError}
            onRetry={() => void query.refetch()}
          />
        </Card>

        <Card title={editing ? t("fuelType.editFuelType") : t("fuelType.newFuelType")}>
          {/* Remounting on `editing` lets the uncontrolled inputs pick up the
              selected row's defaults. */}
          <form key={editing?.id ?? "new"} onSubmit={onSubmit} className="space-y-4">
            <Field label={t("fuelType.name")} htmlFor="name" required error={errors.name}>
              <input id="name" name="name" className="field" required defaultValue={editing?.name} />
            </Field>

            <Field label={t("fuelType.code")} htmlFor="code" required error={errors.code}>
              <input id="code" name="code" className="field" required defaultValue={editing?.code} />
            </Field>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="is_active"
                className="check"
                defaultChecked={editing?.is_active ?? true}
              />
              {t("common.active")}
            </label>

            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary flex-1" disabled={save.isPending}>
                {save.isPending ? t("common.saving") : t("common.save")}
              </button>
              {editing && (
                <button type="button" className="btn btn-quiet" onClick={() => setEditing(null)}>
                  {t("common.cancel")}
                </button>
              )}
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
