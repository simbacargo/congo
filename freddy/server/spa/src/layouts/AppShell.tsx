/**
 * The application frame: sidebar, topbar, and the routed page outlet.
 *
 * Nav visibility is driven entirely by the `permissions` map from
 * `/api/admin/me/` — the client never re-derives access from role strings,
 * which is what `html/base.html` does today and what let the two drift.
 */
import { Suspense, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useIsFetching } from "@tanstack/react-query";

import { useAuth } from "@/auth/AuthProvider";
import { LANGUAGES, setLanguage, type LanguageCode } from "@/i18n";
import type { Permissions } from "@/api/types";
import { Spinner } from "@/components/ui";
import { fullName } from "@/lib/format";

interface NavItem {
  to: string;
  label: string;
  /** Omitted means "visible to everyone who can reach the shell". */
  permission?: keyof Permissions;
  /** Shows the pending-transactions count from /me/. */
  badge?: boolean;
  end?: boolean;
}

interface NavSection {
  heading: string;
  items: NavItem[];
}

function sections(t: (key: string) => string): NavSection[] {
  return [
    {
      heading: t("nav.overview"),
      items: [
        { to: "/", label: t("nav.dashboard"), end: true },
        { to: "/transactions", label: t("nav.transactions"), badge: true },
        { to: "/reports", label: t("nav.reports"), permission: "view_reports" },
      ],
    },
    {
      heading: t("nav.operations"),
      items: [
        { to: "/me/history", label: t("nav.myHistory") },
        {
          to: "/disbursements",
          label: t("nav.disbursements"),
          permission: "manage_disbursements",
        },
      ],
    },
    {
      heading: t("nav.directory"),
      items: [
        { to: "/companies", label: t("nav.companies"), permission: "manage_companies" },
        { to: "/stations", label: t("nav.stations") },
        { to: "/churches", label: t("nav.churches") },
        { to: "/drivers", label: t("nav.drivers"), permission: "view_drivers" },
        { to: "/agents", label: t("nav.agents"), permission: "manage_agents" },
      ],
    },
    {
      heading: t("nav.system"),
      items: [
        { to: "/audit", label: t("nav.audit"), permission: "view_audit" },
        { to: "/fuel-types", label: t("nav.fuelTypes"), permission: "manage_fuel_types" },
        { to: "/verify", label: t("nav.verify") },
      ],
    },
  ];
}

export default function AppShell() {
  const { t, i18n } = useTranslation();
  const { user, can, pendingCount, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const fetching = useIsFetching();

  const visible = sections(t)
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.permission || can(item.permission)),
    }))
    .filter((section) => section.items.length > 0);

  const scope =
    user?.assigned_station_name ?? user?.managed_company_name ?? t(`role.${user?.role}`);

  return (
    <div className="flex min-h-screen bg-page">
      {fetching > 0 && <div className="route-progress" aria-hidden />}

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label={t("common.cancel")}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-sidebar-line px-4 py-4">
          <p className="text-sm font-semibold text-white">{t("app.name")}</p>
          <p className="text-[11px] text-sidebar-fg">{t("app.tagline")}</p>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
          {visible.map((section) => (
            <div key={section.heading}>
              <p className="nav-section">{section.heading}</p>
              <div className="mt-1 space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `nav-link ${isActive ? "nav-active" : ""}`
                    }
                  >
                    <span className="flex-1">{item.label}</span>
                    {item.badge && pendingCount > 0 && (
                      <span className="badge badge-PENDING">{pendingCount}</span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-sidebar-line px-4 py-3">
          <p className="truncate text-xs font-medium text-white">{fullName(user)}</p>
          <p className="truncate text-[11px] text-sidebar-fg">{scope}</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-surface px-4 py-3">
          <button
            type="button"
            className="btn lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label={t("nav.overview")}
          >
            ☰
          </button>

          <div className="flex-1" />

          <label className="sr-only" htmlFor="lang">
            {t("common.language")}
          </label>
          <select
            id="lang"
            className="field w-auto"
            value={i18n.language}
            onChange={(event) => setLanguage(event.target.value as LanguageCode)}
          >
            {LANGUAGES.map((language) => (
              <option key={language.code} value={language.code}>
                {language.label}
              </option>
            ))}
          </select>

          <button type="button" className="btn btn-quiet" onClick={logout}>
            {t("auth.signOut")}
          </button>
        </header>

        {/* The suspense boundary sits here, not around the whole router, so
            the sidebar and topbar paint immediately and only the content area
            waits on its lazily-loaded chunk. On a slow connection that is the
            difference between a blank page and a usable frame. */}
        <main className="min-w-0 flex-1 p-4 lg:p-6">
          <Suspense
            fallback={
              <div className="flex min-h-[50vh] items-center justify-center">
                <Spinner />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
