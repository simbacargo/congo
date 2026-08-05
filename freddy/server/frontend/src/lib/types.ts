export type Role = "NGO_ADMIN" | "COMPANY_MANAGER" | "STATION_AGENT" | string;

export interface User {
  id: string;
  username: string;
  email: string | null;
  firstname: string | null;
  lastname: string | null;
  role: Role;
  is_superuser: boolean;
  assigned_station: string | null;
  assigned_station_name: string | null;
  managed_company: string | null;
  managed_company_name: string | null;
}

export interface Permissions {
  view_dashboard?: boolean;
  view_transactions?: boolean;
  view_drivers?: boolean;
  view_own_history?: boolean;
  manage_stations?: boolean;
  manage_churches?: boolean;
  view_reports?: boolean;
  manage_companies?: boolean;
  manage_agents?: boolean;
  manage_disbursements?: boolean;
  manage_fuel_types?: boolean;
  view_audit?: boolean;
  update_transaction_status?: boolean;
  bulk_update_transactions?: boolean;
  [key: string]: boolean | undefined;
}

export interface LoginResponse {
  token: string;
  expiry: string;
  user: User;
}

export interface MeResponse {
  user: User;
  permissions: Permissions;
  pending_count: number;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
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
  currency_used: "USD" | "CDF" | string;
  amount_usd: string | number;
  amount_cdf: string | number;
  exchange_rate: string | number;
  levy_amount_usd: string | number;
  levy_amount_cdf: string | number;
  status: "PENDING" | "VERIFIED" | "REMITTED" | string;
  notes: string | null;
  driver_phone: string | null;
  sync_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: number;
  receipt_code?: string;
  company_name?: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  changed_by: string | null;
  changed_by_username: string | null;
  changed_at: string;
  ip_address: string | null;
}

export interface Company {
  id: string;
  name: string;
  code: string;
  logo?: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  is_active: boolean;
  created_at: string;
  station_count?: number;
  tx_count?: number;
  total_levy?: string | number | null;
  stations?: Station[];
  totals?: { total_usd: string | number | null; tx_count: number };
}

export interface Station {
  id: string;
  name: string;
  code: string;
  company: string;
  company_name: string;
  address: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  is_active: boolean;
  created_at: string;
  church_count?: number;
  tx_count?: number;
  total_levy?: string | number | null;
  churches?: Church[];
  recent_transactions?: Transaction[];
  totals?: { total_usd: string | number | null; tx_count: number };
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
  total_levy?: string | number | null;
  disburse_count?: number;
  transactions?: Transaction[];
  disbursements?: Disbursement[];
  totals?: { levy: string | number | null; count: number };
}

export interface FuelType {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
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

export interface Disbursement {
  id: string;
  reference: string;
  church: string;
  church_name: string;
  period_start: string;
  period_end: string;
  amount_usd: string | number;
  amount_cdf: string | number;
  status: "SCHEDULED" | "PAID" | "CANCELLED" | string;
  paid_at: string | null;
  payment_method: string | null;
  notes: string | null;
  prepared_by_username: string | null;
  created_at: string;
  updated_at: string;
}

export interface StationTarget {
  id: number;
  station: string;
  station_name: string;
  company_name: string;
  year: number;
  month: number;
  target_usd: string | number;
}

export interface Driver {
  id: string;
  full_name: string | null;
  phone: string | null;
  email?: string | null;
  gender: string | null;
  marital_status?: string | null;
  commune: string | null;
  quartier: string | null;
  city_country?: string | null;
  vehicle_type: string | null;
  vehicle_color?: string | null;
  fuel_type: string | null;
  daily_fuel_consumption?: string | null;
  has_health_coverage?: boolean | null;
  has_care_access_difficulty?: boolean | null;
  dependents?: string | null;
  field_agent: string | null;
  consent?: boolean;
  registration_date?: string | null;
  submitted_at?: string | null;
  score?: number;
  created_at?: string;
}

export interface HistorySummary {
  count: number;
  total_amount_usd: string | number;
  total_amount_cdf: string | number;
  total_levy_usd: string | number;
  total_levy_cdf: string | number;
  first_at: string | null;
  last_at: string | null;
  by_status: Record<string, { count: number; levy_usd: string | number }>;
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
  by_company: Array<Record<string, string | number>>;
  by_fuel: Array<Record<string, string | number>>;
  recent: Transaction[];
  top_stations: Array<{
    id: string;
    name: string;
    company_name: string;
    month_levy: number;
    target_usd: number | null;
    target_pct: number | null;
  }>;
}

export interface DriverListResponse extends Paginated<Driver> {
  filters: Record<string, string>;
  sort: string;
  dir: string;
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
    commune: Array<[string, number]>;
    vehicle: Array<[string, number]>;
    consumption: Array<[string, number]>;
    health: number[];
  };
}

export interface ApiErrorPayload {
  detail?: string;
  [key: string]: unknown;
}
