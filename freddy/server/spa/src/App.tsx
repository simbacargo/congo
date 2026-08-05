import { lazy, Suspense, type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "@/auth/AuthProvider";
import AppShell from "@/layouts/AppShell";
import Login from "@/pages/Login";
import { NotFound } from "@/pages/NotFound";
import { Spinner } from "@/components/ui";
import type { Permissions } from "@/api/types";

// Route-level splitting: the charting pages pull in Chart.js, which is the
// single biggest dependency and shouldn't be in the login-screen payload.
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Transactions = lazy(() => import("@/pages/Transactions"));
const TransactionDetail = lazy(() => import("@/pages/TransactionDetail"));
const Companies = lazy(() => import("@/pages/Companies"));
const CompanyDetail = lazy(() =>
  import("@/pages/Companies").then((m) => ({ default: m.CompanyDetail })),
);
const CompanyForm = lazy(() => import("@/pages/CompanyForm"));
const Stations = lazy(() => import("@/pages/Stations"));
const StationDetail = lazy(() =>
  import("@/pages/Stations").then((m) => ({ default: m.StationDetail })),
);
const StationForm = lazy(() => import("@/pages/StationForm"));
const Churches = lazy(() => import("@/pages/Churches"));
const ChurchDetail = lazy(() =>
  import("@/pages/Churches").then((m) => ({ default: m.ChurchDetail })),
);
const ChurchForm = lazy(() => import("@/pages/ChurchForm"));
const Drivers = lazy(() => import("@/pages/Drivers"));
const DriverDetail = lazy(() => import("@/pages/DriverDetail"));
const Agents = lazy(() => import("@/pages/Agents"));
const AgentDetail = lazy(() => import("@/pages/Agents").then((m) => ({ default: m.AgentDetail })));
const MyHistory = lazy(() => import("@/pages/Agents").then((m) => ({ default: m.MyHistory })));
const AgentForm = lazy(() => import("@/pages/AgentForm"));
const Disbursements = lazy(() => import("@/pages/Disbursements"));
const DisbursementForm = lazy(() => import("@/pages/DisbursementForm"));
const Reports = lazy(() => import("@/pages/Reports"));
const Audit = lazy(() => import("@/pages/Audit"));
const FuelTypes = lazy(() => import("@/pages/FuelTypes"));
const Verify = lazy(() => import("@/pages/Verify"));

/**
 * Hides a route behind a capability from `/me/`.
 *
 * This is a usability guard, not the security boundary — the API refuses or
 * scopes every request on its own. It exists so a user never lands on a page
 * that would only render empty tables.
 */
function Guard({
  permission,
  children,
}: {
  permission: keyof Permissions;
  children: ReactNode;
}) {
  const { can } = useAuth();
  if (!can(permission)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner />
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <Loading />;

  if (!user) {
    return (
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          {/* Receipt verification is public — the endpoint is AllowAny. */}
          <Route path="/verify" element={<Verify />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/login" element={<Navigate to="/" replace />} />

        <Route element={<AppShell />}>
          <Route index element={<Dashboard />} />

          <Route path="transactions" element={<Transactions />} />
          <Route path="transactions/:id" element={<TransactionDetail />} />

          <Route
            path="companies"
            element={
              <Guard permission="manage_companies">
                <Companies />
              </Guard>
            }
          />
          <Route path="companies/new" element={<Guard permission="manage_companies"><CompanyForm /></Guard>} />
          <Route path="companies/:id" element={<CompanyDetail />} />
          <Route
            path="companies/:id/edit"
            element={
              <Guard permission="manage_companies">
                <CompanyForm />
              </Guard>
            }
          />

          <Route path="stations" element={<Stations />} />
          <Route path="stations/new" element={<Guard permission="manage_stations"><StationForm /></Guard>} />
          <Route path="stations/:id" element={<StationDetail />} />
          <Route
            path="stations/:id/edit"
            element={
              <Guard permission="manage_stations">
                <StationForm />
              </Guard>
            }
          />

          <Route path="churches" element={<Churches />} />
          <Route path="churches/new" element={<Guard permission="manage_churches"><ChurchForm /></Guard>} />
          <Route path="churches/:id" element={<ChurchDetail />} />
          <Route
            path="churches/:id/edit"
            element={
              <Guard permission="manage_churches">
                <ChurchForm />
              </Guard>
            }
          />

          <Route
            path="drivers"
            element={
              <Guard permission="view_drivers">
                <Drivers />
              </Guard>
            }
          />
          <Route path="drivers/:id" element={<DriverDetail />} />

          <Route
            path="agents"
            element={
              <Guard permission="manage_agents">
                <Agents />
              </Guard>
            }
          />
          <Route path="agents/new" element={<Guard permission="manage_agents"><AgentForm /></Guard>} />
          <Route path="agents/:id" element={<AgentDetail />} />
          <Route
            path="agents/:id/edit"
            element={
              <Guard permission="manage_agents">
                <AgentForm />
              </Guard>
            }
          />
          <Route path="me/history" element={<MyHistory />} />

          <Route
            path="disbursements"
            element={
              <Guard permission="manage_disbursements">
                <Disbursements />
              </Guard>
            }
          />
          <Route
            path="disbursements/new"
            element={
              <Guard permission="manage_disbursements">
                <DisbursementForm />
              </Guard>
            }
          />
          <Route
            path="disbursements/:id/edit"
            element={
              <Guard permission="manage_disbursements">
                <DisbursementForm />
              </Guard>
            }
          />

          <Route
            path="reports"
            element={
              <Guard permission="view_reports">
                <Reports />
              </Guard>
            }
          />
          <Route
            path="audit"
            element={
              <Guard permission="view_audit">
                <Audit />
              </Guard>
            }
          />
          <Route
            path="fuel-types"
            element={
              <Guard permission="manage_fuel_types">
                <FuelTypes />
              </Guard>
            }
          />
          <Route path="verify" element={<Verify />} />

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
