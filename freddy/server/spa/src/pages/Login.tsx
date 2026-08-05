import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthProvider";
import { LANGUAGES, setLanguage, type LanguageCode } from "@/i18n";

export default function Login() {
  const { t, i18n } = useTranslation();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(username, password);
      // No navigate() call: once `user` is set the router swaps the public
      // routes for the app shell and lands on the dashboard.
    } catch (caught) {
      setError(
        caught instanceof ApiError && caught.status === 401
          ? t("auth.invalid")
          : caught instanceof Error
            ? caught.message
            : t("common.error"),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-page p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold">{t("app.name")}</h1>
          <p className="text-xs text-muted">{t("app.tagline")}</p>
        </div>

        <form onSubmit={onSubmit} className="card space-y-4 p-5">
          <h2 className="text-sm font-semibold">{t("auth.welcome")}</h2>

          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label htmlFor="username" className="text-xs font-medium">
              {t("auth.username")}
            </label>
            <input
              id="username"
              className="field"
              autoComplete="username"
              autoFocus
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-xs font-medium">
              {t("auth.password")}
            </label>
            <input
              id="password"
              type="password"
              className="field"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={busy}>
            {busy ? t("auth.signingIn") : t("auth.signIn")}
          </button>
        </form>

        <div className="mt-4 flex justify-center">
          <select
            className="field w-auto"
            aria-label={t("common.language")}
            value={i18n.language}
            onChange={(event) => setLanguage(event.target.value as LanguageCode)}
          >
            {LANGUAGES.map((language) => (
              <option key={language.code} value={language.code}>
                {language.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
