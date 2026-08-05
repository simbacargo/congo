/**
 * Query and mutation hooks, one per resource.
 *
 * Every list hook takes the URL filter object straight through as query
 * params, so the API sees exactly what the address bar shows.
 */
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";

import { request, type RequestOptions } from "./client";
import type {
  Agent,
  AgentHistoryResponse,
  AuditRow,
  Church,
  Company,
  Disbursement,
  DriverDetail,
  DriverListResponse,
  FuelType,
  Paginated,
  ReportsResponse,
  Station,
  StationHistoryResponse,
  StationTarget,
  TransactionDetail,
  TransactionListResponse,
} from "./types";

type Params = Record<string, string | number | undefined>;

/** Lists the SPA needs in full for dropdowns — the API pages at 25 by default. */
const ALL = { page_size: 100 };

// ─── Transactions ────────────────────────────────────────────────────────────

export function useTransactions(params: Params) {
  return useQuery({
    queryKey: ["transactions", params],
    queryFn: () => request<TransactionListResponse>("/transactions/", { params }),
  });
}

export function useTransaction(id: string | undefined) {
  return useQuery({
    queryKey: ["transaction", id],
    queryFn: () => request<TransactionDetail>(`/transactions/${id}/`),
    enabled: Boolean(id),
  });
}

export function useUpdateTransaction(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { status?: string; notes?: string }) =>
      request<TransactionDetail>(`/transactions/${id}/`, { method: "PATCH", body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["transaction", id] });
      void queryClient.invalidateQueries({ queryKey: ["transactions"] });
      void queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

export function useBulkTransactions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { ids: string[]; action: "verify" | "remit" }) =>
      request<{ updated: number }>("/transactions/bulk/", { method: "POST", body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["transactions"] });
      void queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

// ─── Directory ───────────────────────────────────────────────────────────────

export function useCompanies(params: Params = ALL) {
  return useQuery({
    queryKey: ["companies", params],
    queryFn: () => request<Paginated<Company>>("/companies/", { params }),
  });
}

export function useCompany(id: string | undefined) {
  return useQuery({
    queryKey: ["company", id],
    queryFn: () =>
      request<Company & { stations: Station[]; totals: { total_usd: number; tx_count: number } }>(
        `/companies/${id}/`,
      ),
    enabled: Boolean(id),
  });
}

export function useStations(params: Params = ALL) {
  return useQuery({
    queryKey: ["stations", params],
    queryFn: () => request<Paginated<Station>>("/stations/", { params }),
  });
}

export function useStation(id: string | undefined) {
  return useQuery({
    queryKey: ["station", id],
    queryFn: () =>
      request<Station & { churches: Church[]; totals: { total_usd: number; tx_count: number } }>(
        `/stations/${id}/`,
      ),
    enabled: Boolean(id),
  });
}

export function useChurches(params: Params = ALL) {
  return useQuery({
    queryKey: ["churches", params],
    queryFn: () => request<Paginated<Church>>("/churches/", { params }),
  });
}

export function useChurch(id: string | undefined) {
  return useQuery({
    queryKey: ["church", id],
    queryFn: () =>
      request<
        Church & {
          transactions: TransactionDetail[];
          disbursements: Disbursement[];
          totals: { levy: number; count: number };
        }
      >(`/churches/${id}/`),
    enabled: Boolean(id),
  });
}

// ─── Agents ──────────────────────────────────────────────────────────────────

export function useAgents(params: Params = ALL) {
  return useQuery({
    queryKey: ["agents", params],
    queryFn: () => request<Paginated<Agent>>("/agents/", { params }),
  });
}

export function useAgent(id: string | undefined) {
  return useQuery({
    queryKey: ["agent", id],
    queryFn: () => request<Agent>(`/agents/${id}/`),
    enabled: Boolean(id),
  });
}

// ─── History ─────────────────────────────────────────────────────────────────

export function useAgentHistory(id: string | "me" | undefined, params: Params) {
  return useQuery({
    queryKey: ["agent-history", id, params],
    queryFn: () => request<AgentHistoryResponse>(`/agents/${id}/history/`, { params }),
    enabled: Boolean(id),
  });
}

export function useStationHistory(id: string | "me" | undefined, params: Params) {
  return useQuery({
    queryKey: ["station-history", id, params],
    queryFn: () => request<StationHistoryResponse>(`/stations/${id}/history/`, { params }),
    enabled: Boolean(id),
  });
}

// ─── Drivers ─────────────────────────────────────────────────────────────────

export function useDrivers(params: Params) {
  return useQuery({
    queryKey: ["drivers", params],
    queryFn: () => request<DriverListResponse>("/drivers/", { params }),
  });
}

export function useDriver(id: string | undefined) {
  return useQuery({
    queryKey: ["driver", id],
    queryFn: () => request<DriverDetail>(`/drivers/${id}/`),
    enabled: Boolean(id),
  });
}

// ─── Disbursements ───────────────────────────────────────────────────────────

export function useDisbursements(params: Params) {
  return useQuery({
    queryKey: ["disbursements", params],
    queryFn: () =>
      request<Paginated<Disbursement> & { totals: { total: number; count: number } }>(
        "/disbursements/",
        { params },
      ),
  });
}

export function useDisbursement(id: string | undefined) {
  return useQuery({
    queryKey: ["disbursement", id],
    queryFn: () => request<Disbursement>(`/disbursements/${id}/`),
    enabled: Boolean(id),
  });
}

export function useMarkDisbursementPaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      request<Disbursement>(`/disbursements/${id}/pay/`, { method: "POST" }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["disbursements"] }),
  });
}

// ─── Fuel types & targets ────────────────────────────────────────────────────

export function useFuelTypes() {
  return useQuery({
    queryKey: ["fuel-types"],
    // The viewset sets pagination_class = None, so this is a bare array.
    queryFn: () => request<FuelType[]>("/fuel-types/"),
    staleTime: 5 * 60_000,
  });
}

export function useStationTargets(params: Params) {
  return useQuery({
    queryKey: ["station-targets", params],
    queryFn: () => request<Paginated<StationTarget>>("/station-targets/", { params }),
  });
}

// ─── Reports & audit ─────────────────────────────────────────────────────────

export function useReports() {
  return useQuery({ queryKey: ["reports"], queryFn: () => request<ReportsResponse>("/reports/") });
}

export function useAuditLog(params: Params) {
  return useQuery({
    queryKey: ["audit", params],
    queryFn: () => request<Paginated<AuditRow>>("/audit/", { params }),
  });
}

// ─── Generic create/update ───────────────────────────────────────────────────

/**
 * Save a resource, creating when `id` is absent and patching when present.
 *
 * `invalidate` lists the query keys that go stale — every list the record
 * appears in, plus its own detail entry.
 */
export function useSave<T>(
  resource: string,
  id: string | undefined,
  invalidate: string[],
  options?: Omit<UseMutationOptions<T, Error, unknown>, "mutationFn">,
) {
  const queryClient = useQueryClient();
  return useMutation<T, Error, unknown>({
    mutationFn: (body) => {
      const path = id ? `/${resource}/${id}/` : `/${resource}/`;
      const method = id ? "PATCH" : "POST";
      const payload: RequestOptions =
        body instanceof FormData ? { method, formData: body } : { method, body };
      return request<T>(path, payload);
    },
    ...options,
    // Forwarded with rest args so the caller's callback keeps working across
    // TanStack Query's onSuccess signature changes.
    onSuccess: (...args: Parameters<NonNullable<NonNullable<typeof options>["onSuccess"]>>) => {
      for (const key of invalidate) {
        void queryClient.invalidateQueries({ queryKey: [key] });
      }
      options?.onSuccess?.(...args);
    },
  });
}
