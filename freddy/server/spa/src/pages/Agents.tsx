import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useAgent, useAgentHistory, useAgents } from "@/api/hooks";
import { useAuth } from "@/auth/AuthProvider";
import type { Agent } from "@/api/types";
import { Card, DetailRow, ErrorState, Spinner } from "@/components/ui";
import { DataTable, type Column } from "@/components/DataTable";
import { HistoryBlock } from "@/components/HistoryBlock";
import { useFilters, toParams } from "@/lib/useFilters";
import { date, dateTime, fullName, orDash } from "@/lib/format";

const ROLE_BADGE: Record<string, string> = {
  NGO_ADMIN: "badge-REMITTED",
  COMPANY_MANAGER: "badge-VERIFIED",
  STATION_AGENT: "badge-SCHEDULED",
};

export default function Agents() {
  const { t } = useTranslation();
  const { can } = useAuth();
  const query = useAgents();

  const columns: Column<Agent>[] = [
    {
      key: "username",
      header: t("agent.username"),
      render: (row) => (
        <Link to={`/agents/${row.id}`} className="font-medium hover:underline">
          {row.username}
        </Link>
      ),
    },
    { key: "name", header: t("agent.firstname"), render: (row) => fullName(row) },
    {
      key: "role",
      header: t("agent.role"),
      render: (row) => (
        <span className={`badge ${ROLE_BADGE[row.role] ?? "badge-SCHEDULED"}`}>
          {t(`role.${row.role}`)}
        </span>
      ),
    },
    {
      key: "scope",
      header: t("agent.assignedStation"),
      render: (row) => orDash(row.assigned_station_name ?? row.managed_company_name),
    },
    { key: "email", header: t("agent.email"), render: (row) => orDash(row.email) },
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
      key: "lastSeen",
      header: t("agent.lastSeen"),
      render: (row) => <span className="text-xs text-muted">{dateTime(row.last_seen)}</span>,
    },
    ...(can("manage_agents")
      ? [
          {
            key: "actions",
            header: t("common.actions"),
            render: (row: Agent) => (
              <Link to={`/agents/${row.id}/edit`} className="btn btn-quiet">
                {t("common.edit")}
              </Link>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">{t("agent.title")}</h1>
        {can("manage_agents") && (
          <Link to="/agents/new" className="btn btn-primary">
            {t("agent.newAgent")}
          </Link>
        )}
      </header>

      <Card bodyClassName="">
        <DataTable
          columns={columns}
          rows={query.data?.results}
          rowKey={(row) => row.id}
          isLoading={query.isLoading}
          isError={query.isError}
          onRetry={() => void query.refetch()}
        />
      </Card>
    </div>
  );
}

export function AgentDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { can, user } = useAuth();
  const { values, setFilters, page, setPage } = useFilters();

  const query = useAgent(id);
  const history = useAgentHistory(id, { ...toParams(values), page });

  if (query.isLoading) return <Spinner />;
  if (query.isError || !query.data) return <ErrorState onRetry={() => void query.refetch()} />;

  const agent = query.data;
  const isSelf = user?.id === agent.id;

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {can("manage_agents") && (
            <Link to="/agents" className="text-xs text-muted hover:underline">
              ← {t("agent.title")}
            </Link>
          )}
          <h1 className="text-lg font-semibold">{fullName(agent)}</h1>
          <p className="text-xs text-muted">
            {agent.username} · {t(`role.${agent.role}`)}
            {isSelf && ` · ${t("nav.myHistory")}`}
          </p>
        </div>
        {can("manage_agents") && (
          <Link to={`/agents/${agent.id}/edit`} className="btn">
            {t("common.edit")}
          </Link>
        )}
      </header>

      <Card title={t("agent.title")}>
        <div className="grid gap-x-8 sm:grid-cols-2">
          <DetailRow label={t("agent.username")} value={agent.username} />
          <DetailRow label={t("agent.email")} value={orDash(agent.email)} />
          <DetailRow label={t("agent.mobile")} value={orDash(agent.mobile)} />
          <DetailRow label={t("agent.role")} value={t(`role.${agent.role}`)} />
          <DetailRow
            label={t("agent.assignedStation")}
            value={orDash(agent.assigned_station_name)}
          />
          <DetailRow label={t("agent.managedCompany")} value={orDash(agent.managed_company_name)} />
          <DetailRow label={t("agent.joined")} value={date(agent.date_joined)} />
          <DetailRow label={t("agent.lastSeen")} value={dateTime(agent.last_seen)} />
        </div>
      </Card>

      <h2 className="text-sm font-semibold">{t("history.title")}</h2>
      <HistoryBlock
        data={history.data}
        isLoading={history.isLoading}
        isError={history.isError}
        onRetry={() => void history.refetch()}
        filters={values}
        setFilters={setFilters}
        page={page}
        setPage={setPage}
        hideAgent
      />
    </div>
  );
}

/** "My history" — the one page every role can reach for itself. */
export function MyHistory() {
  const { t } = useTranslation();
  const { values, setFilters, page, setPage } = useFilters();
  const history = useAgentHistory("me", { ...toParams(values), page });

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-lg font-semibold">{t("nav.myHistory")}</h1>
        <p className="text-xs text-muted">{history.data?.agent?.station_name ?? ""}</p>
      </header>

      <HistoryBlock
        data={history.data}
        isLoading={history.isLoading}
        isError={history.isError}
        onRetry={() => void history.refetch()}
        filters={values}
        setFilters={setFilters}
        page={page}
        setPage={setPage}
        hideAgent
        hideChurch
        hideLevy
      />
    </div>
  );
}
