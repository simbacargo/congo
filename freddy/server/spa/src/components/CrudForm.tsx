/**
 * Shell for the create/edit forms, equivalent to `partials/_form_page.html`.
 *
 * DRF returns validation errors keyed by field name; `fieldErrors` maps them
 * back onto the inputs so the user sees the message next to the offending
 * field rather than as one opaque banner.
 */
import type { FormEvent, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ApiError } from "@/api/client";

export function useFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError) || !error.fields) return {};
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(error.fields)) {
    if (Array.isArray(value)) result[key] = value.join(" ");
    else if (typeof value === "string") result[key] = value;
  }
  return result;
}

export function CrudForm({
  title,
  onSubmit,
  busy,
  error,
  cancelTo,
  children,
  multipart = false,
}: {
  title: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  busy?: boolean;
  error?: unknown;
  cancelTo: string;
  children: ReactNode;
  multipart?: boolean;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // DRF puts cross-field problems under non_field_errors / detail; those have
  // no input to attach to, so they surface as a banner.
  const fieldErrors = useFieldErrors(error);
  const banner =
    fieldErrors.non_field_errors ??
    fieldErrors.detail ??
    (error instanceof ApiError && !error.fields ? error.message : undefined) ??
    (error && !(error instanceof ApiError) ? t("common.error") : undefined);

  return (
    <form
      onSubmit={onSubmit}
      encType={multipart ? "multipart/form-data" : undefined}
      className="card mx-auto max-w-2xl"
      noValidate
    >
      <header className="border-b border-line px-5 py-4">
        <h1 className="text-sm font-semibold">{title}</h1>
      </header>

      <div className="space-y-4 p-5">
        {banner && (
          <div className="alert alert-error" role="alert">
            {banner}
          </div>
        )}
        {children}
      </div>

      <footer className="flex items-center justify-end gap-2 border-t border-line px-5 py-4">
        <button type="button" className="btn btn-quiet" onClick={() => navigate(cancelTo)}>
          {t("common.cancel")}
        </button>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? t("common.saving") : t("common.save")}
        </button>
      </footer>
    </form>
  );
}

/** Reads a form into a plain object, dropping the blanks DRF would reject. */
export function formValues(form: HTMLFormElement): Record<string, unknown> {
  const data = new FormData(form);
  const result: Record<string, unknown> = {};
  for (const [key, value] of data.entries()) {
    // Files belong on a multipart submit, not this JSON body.
    if (typeof value !== "string") continue;
    if (value === "") continue;
    result[key] = value;
  }
  // Unchecked boxes are absent from FormData; send them explicitly as false so
  // clearing `is_active` actually persists.
  for (const element of Array.from(form.elements)) {
    if (element instanceof HTMLInputElement && element.type === "checkbox" && element.name) {
      result[element.name] = element.checked;
    }
  }
  return result;
}
