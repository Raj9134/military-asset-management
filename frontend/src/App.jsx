import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext.jsx";
import { AppLayout } from "./components/layout/AppLayout.jsx";
import { can } from "./utils/permissions.js";

import { LoginPage } from "./pages/LoginPage.jsx";
import { DashboardPage } from "./pages/DashboardPage.jsx";
import { PurchasesPage } from "./pages/PurchasesPage.jsx";
import { TransfersPage } from "./pages/TransfersPage.jsx";
import { MovementsPage } from "./pages/MovementsPage.jsx";
import { AuditLogsPage } from "./pages/AuditLogsPage.jsx";
import { UsersPage } from "./pages/UsersPage.jsx";
import { BasesPage } from "./pages/BasesPage.jsx";
import { EquipmentTypesPage } from "./pages/EquipmentTypesPage.jsx";
import { ProfilePage } from "./pages/ProfilePage.jsx";
import { Spinner } from "./components/ui/index.jsx";

/** Sends unauthenticated visitors to the login screen. */
function RequireAuth({ children }) {
  const { user, loading } = useAuth();

  // Checking first avoids a flash of the login screen while a stored token is
  // being verified with the API.
  if (loading) return <Spinner label="Restoring session" />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

/**
 * Hides routes a role cannot use.
 *
 * This is presentation only. Each of these endpoints independently refuses the
 * request from the backend, so bypassing this guard would show a page full of
 * failed requests and change no data.
 */
function RequirePermission({ permission, children }) {
  const { user } = useAuth();
  if (!can(user.role, permission)) return <Navigate to="/forbidden" replace />;
  return children;
}

function ForbiddenPage() {
  return (
    <div className="card">
      <div className="state">
        <span className="state-icon">⛔</span>
        <h3>Not available for your role</h3>
        <p>Your account does not have access to this section.</p>
        <a className="btn btn-secondary" href="/dashboard">Back to dashboard</a>
      </div>
    </div>
  );
}

function NotFoundPage() {
  return (
    <div className="card">
      <div className="state">
        <span className="state-icon">◌</span>
        <h3>Page not found</h3>
        <p>The page you asked for does not exist.</p>
        <a className="btn btn-secondary" href="/dashboard">Back to dashboard</a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/purchases" element={<RequirePermission permission="purchases:read"><PurchasesPage /></RequirePermission>} />
            <Route path="/transfers" element={<RequirePermission permission="transfers:read"><TransfersPage /></RequirePermission>} />
            <Route path="/movements" element={<RequirePermission permission="assignments:read"><MovementsPage /></RequirePermission>} />
            <Route path="/audit-logs" element={<RequirePermission permission="audit:read"><AuditLogsPage /></RequirePermission>} />
            <Route path="/users" element={<RequirePermission permission="users:read"><UsersPage /></RequirePermission>} />
            <Route path="/bases" element={<RequirePermission permission="bases:read"><BasesPage /></RequirePermission>} />
            <Route path="/equipment-types" element={<RequirePermission permission="equipment:read"><EquipmentTypesPage /></RequirePermission>} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/forbidden" element={<ForbiddenPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
