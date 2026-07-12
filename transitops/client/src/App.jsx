import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import VehicleDetail from './pages/vehicles/VehicleDetail';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';
import { ROLES } from './utils/constants';

function PageStub({ title, description }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      {description ? (
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      ) : null}
    </div>
  );
}

function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <PageStub
        title="Sign in"
        description="Login page placeholder — wire up AuthContext signIn here."
      />
    </div>
  );
}

const MANAGEMENT_ROLES = [ROLES.ADMIN, ROLES.DISPATCHER];
const REPORT_ROLES = [ROLES.ADMIN, ROLES.DISPATCHER, ROLES.VIEWER];

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={
                <PageStub
                  title="Dashboard"
                  description="Fleet KPIs, utilization, and cost overview."
                />
              }
            />

            <Route path="/vehicles">
              <Route
                index
                element={
                  <PageStub title="Vehicles" description="Browse and manage fleet vehicles." />
                }
              />
              <Route element={<RoleRoute allowedRoles={MANAGEMENT_ROLES} />}>
                <Route
                  path="new"
                  element={<PageStub title="Add Vehicle" description="Register a new fleet asset." />}
                />
                <Route
                  path=":id/edit"
                  element={<PageStub title="Edit Vehicle" description="Update vehicle details." />}
                />
              </Route>
              <Route path=":id" element={<VehicleDetail />} />
            </Route>

            <Route path="/drivers">
              <Route
                index
                element={
                  <PageStub title="Drivers" description="Browse and manage driver roster." />
                }
              />
              <Route element={<RoleRoute allowedRoles={MANAGEMENT_ROLES} />}>
                <Route
                  path="new"
                  element={<PageStub title="Add Driver" description="Onboard a new driver." />}
                />
                <Route
                  path=":id/edit"
                  element={<PageStub title="Edit Driver" description="Update driver information." />}
                />
              </Route>
              <Route
                path=":id"
                element={<PageStub title="Driver Details" description="View driver profile and assignments." />}
              />
            </Route>

            <Route path="/trips">
              <Route
                index
                element={<PageStub title="Trips" description="Track transport jobs and lifecycle." />}
              />
              <Route element={<RoleRoute allowedRoles={MANAGEMENT_ROLES} />}>
                <Route
                  path="new"
                  element={<PageStub title="Create Trip" description="Plan and dispatch a new trip." />}
                />
              </Route>
              <Route
                path=":id"
                element={<PageStub title="Trip Details" description="View trip status and metrics." />}
              />
            </Route>

            <Route element={<RoleRoute allowedRoles={MANAGEMENT_ROLES} />}>
              <Route
                path="/maintenance"
                element={
                  <PageStub
                    title="Maintenance"
                    description="Active and closed maintenance work orders."
                  />
                }
              />
              <Route
                path="/expenses/new"
                element={
                  <PageStub title="Log Expense" description="Record tolls, maintenance, or other costs." />
                }
              />
            </Route>

            <Route
              path="/fuel-logs"
              element={
                <PageStub title="Fuel Logs" description="Fuel fill-ups and consumption records." />
              }
            />

            <Route element={<RoleRoute allowedRoles={REPORT_ROLES} />}>
              <Route
                path="/reports"
                element={
                  <PageStub
                    title="Reports"
                    description="Cost, utilization, and fleet performance reports."
                  />
                }
              />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
