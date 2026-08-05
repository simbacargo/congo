/** Response shapes returned by /api/admin/. Mirrors the DRF serializers. */
import type { CurrentUser, Role } from "./client";

export type { CurrentUser, Role };

export type TxStatus = "PENDING" | "VERIFIED" | "REMITTED";
export type DisbursementStatus = "SCHEDULED" | "PAID" | "CANCELLED";

/** DRF PageNumberPagination envelope. */
export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Permissions {
  view_dashboard: boolean;
  view_transactions: boolean;
  view_drivers: boolean;
  view_own_history: boolean;
  manage_stations: boolean;
  manage_churches: boolean;
  view_reports: boolean;
  manage_companies: boolean;
  manage_agents: boolean;
  manage_disbursements: boolean;
  manage_fuel_types: boolean;
  view_audit: boolean;
  update_transaction_status: boolean;
  bulk_update_transactions: boolean;
}

export interface MeResponse {
  user: CurrentUser;
  permissions: Permissions;
  pending_count: number;
}

export interface LoginResponse {
  token: string;
  expiry: string;
  user: CurrentUser;
}

export interface Transaction {
  id: string;
  receipt_code: string;
  station: string;
  station_name: string;
  company_name: string;
  church: string;
  church_name: string;
  agent: string;
  agent_username: string;
  fuel_type: string;
  fuel_type_name: string;
  currency_used: "USD" | "CDF";
  amount_usd: string;
  amount_cdf: string;
  exchange_rate: string;
  levy_amount_usd: string;
  levy_amount_cdf: string;
  status: TxStatus;
  notes: string | null;
  driver_phone: string | null;
  sync_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLogEntry {
  id: number;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  changed_by_username: string | null;
  changed_at: string;
  ip_address: string | null;
}

export interface TransactionDetail extends Transaction {
  audit_logs: AuditLogEntry[];
}

export interface AuditRow extends AuditLogEntry {
  receipt_code: string;
  company_name: string;
}

/** `[label, count]` pairs used by every breakdown chart. */
export type Breakdown = [string, number][];

export interface TopStation {
  id: string;
  name: string;
  company_name: string;
  month_levy: number;
  target_usd: number | null;
  target_pct: number | null;
}

export interface DashboardStats {
  today_levy: string | number;
  today_count: number;
  month_levy: string | number;
  month_count: number;
  total_levy: string | number;
  total_count: number;
  pending_count: number;
  verified_count: number;
  remitted_count: number;
  total_disbursed: string | number;
  pending_disburse: number;
  by_company: { station__company__name: string; station__company__id: string; total: number; count: number }[];
  by_fuel: { fuel_type__name: string; total: number; count: number }[];
  recent: Transaction[];
  top_stations: TopStation[];
}

export interface ChartPoint {
  date: string;
  amount: number;
}

export interface Company {
  id: string;
  name: string;
  code: string;
  logo: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  is_active: boolean;
  created_at: string;
  station_count?: number;
  tx_count?: number;
  total_levy?: string | null;
}

export interface Station {
  id: string;
  name: string;
  code: string;
  company: string;
  company_name: string;
  address: string | null;
  latitude: string | null;
  longitude: string | null;
  is_active: boolean;
  created_at: string;
  church_count?: number;
  tx_count?: number;
  total_levy?: string | null;
}

export interface Church {
  id: string;
  name: string;
  station: string;
  station_name: string;
  company_name: string;
  contact_person: string | null;
  contact_phone: string | null;
  beneficiary_count: number;
  is_active: boolean;
  created_at: string;
  tx_count?: number;
  total_levy?: string | null;
  disburse_count?: number;
}

export interface Disbursement {
  id: string;
  reference: string;
  church: string;
  church_name: string;
  period_start: string;
  period_end: string;
  amount_usd: string;
  amount_cdf: string;
  status: DisbursementStatus;
  paid_at: string | null;
  payment_method: string | null;
  notes: string | null;
  prepared_by_username: string | null;
  created_at: string;
  updated_at: string;
}

export interface FuelType {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
}

export interface StationTarget {
  id: number;
  station: string;
  station_name: string;
  company_name: string;
  year: number;
  month: number;
  target_usd: string;
}

export interface Agent {
  id: string;
  username: string;
  firstname: string | null;
  lastname: string | null;
  email: string | null;
  mobile: string | null;
  role: Role;
  assigned_station: string | null;
  assigned_station_name: string | null;
  managed_company: string | null;
  managed_company_name: string | null;
  is_active: boolean;
  date_joined: string;
  last_seen: string;
}

export interface DriverListRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  gender: string | null;
  marital_status: string | null;
  commune: string | null;
  quartier: string | null;
  vehicle_type: string | null;
  fuel_type: string | null;
  daily_fuel_consumption: string | null;
  has_health_coverage: boolean | null;
  field_agent: string | null;
  registration_date: string | null;
}

export interface DriverListResponse extends Paginated<DriverListRow> {
  filters: Record<string, string>;
  sort: string;
  dir: "asc" | "desc";
  filter_options: {
    communes: string[];
    vehicle_types: string[];
    fuel_types: string[];
    agents: string[];
  };
  kpi: {
    filtered: number;
    total: number;
    top_vehicle: string;
    top_vehicle_n: number;
    coverage_pct: number;
    agents: number;
  };
  charts: {
    commune: Breakdown;
    vehicle: Breakdown;
    consumption: Breakdown;
    /** `[yes, no, unknown]` counts for health coverage. */
    health: [number, number, number];
  };
}

export interface DriverDetail {
  driver: DriverListRow & {
    city_country: string | null;
    vehicle_color: string | null;
    has_care_access_difficulty: boolean | null;
    dependents: string | null;
    consent: boolean;
    submitted_at: string | null;
    score: number;
    created_at: string;
  };
  qr_code: string;
  profile_url: string;
  transactions: Transaction[];
  summary: { count: number; total_levy_usd: string; total_amount_usd: string };
}

export interface HistorySummary {
  count: number;
  total_amount_usd: string;
  total_amount_cdf: string;
  total_levy_usd: string;
  total_levy_cdf: string;
  first_at: string | null;
  last_at: string | null;
  by_status: Record<string, { count: number; levy_usd: string }>;
}

export interface HistoryResponse {
  summary: HistorySummary;
  count: number;
  page: number;
  num_pages: number;
  next: string | null;
  previous: string | null;
  results: Transaction[];
}

export interface AgentHistoryResponse extends HistoryResponse {
  agent: {
    id: string;
    username: string;
    full_name: string | null;
    role: Role;
    station: string | null;
    station_name: string | null;
  };
}

export interface StationHistoryResponse extends HistoryResponse {
  station: { id: string; name: string; code: string; company: string };
  by_agent: { agent: string; username: string; count: number; levy_usd: string }[];
}

export interface ReportsResponse {
  monthly: { label: string; levy: number; count: number }[];
  church_summary: {
    church__name: string;
    church__id: string;
    church__station__name: string;
    church__station__company__name: string;
    total_levy: number;
    tx_count: number;
  }[];
  fuel_summary: { fuel_type__name: string; total: number; count: number }[];
  stats: DashboardStats;
}

export interface TransactionListResponse extends Paginated<Transaction> {
  totals: { levy: number | string; count: number };
}
