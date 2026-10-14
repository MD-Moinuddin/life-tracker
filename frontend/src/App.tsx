import { useEffect } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { refresh } from "./lib/auth-api";
import { ROUTES } from "./lib/routes";
import { DashboardPage } from "./pages/DashboardPage";
import { JobDetailPage } from "./pages/JobDetailPage";
import { JobsPage } from "./pages/JobsPage";
import { LoginPage } from "./pages/LoginPage";
import { ShiftsPage } from "./pages/ShiftsPage";
import { SignupPage } from "./pages/SignupPage";
import { SummaryPage } from "./pages/SummaryPage";
import { useAuthStore } from "./store/auth-store";

function App() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const setInitialized = useAuthStore((state) => state.setInitialized);

  useEffect(() => {
    refresh()
      .then(setAuth)
      .catch(() => {
        // No valid refresh cookie (new visitor or expired session) — stay logged out silently.
      })
      .finally(setInitialized);
  }, [setAuth, setInitialized]);

  return (
    <Routes>
      <Route
        path={ROUTES.home}
        element={<Navigate to={ROUTES.dashboard} replace />}
      />
      <Route path={ROUTES.login} element={<LoginPage />} />
      <Route path={ROUTES.signup} element={<SignupPage />} />
      <Route
        element={
          <ProtectedRoute>
            <Outlet />
          </ProtectedRoute>
        }
      >
        <Route path={ROUTES.dashboard} element={<DashboardPage />} />
        <Route path={ROUTES.jobs} element={<JobsPage />} />
        <Route path={ROUTES.jobDetail} element={<JobDetailPage />} />
        <Route path={ROUTES.shifts} element={<ShiftsPage />} />
        <Route path={ROUTES.summary} element={<SummaryPage />} />
      </Route>
      <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
    </Routes>
  );
}

export default App;
