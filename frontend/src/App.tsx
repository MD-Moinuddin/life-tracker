import { useEffect } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { ToastProvider } from "./components/ui/ToastProvider";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { ApiError } from "./lib/api-client";
import { refresh } from "./lib/auth-api";
import { ROUTES } from "./lib/routes";
import { hasSessionHint } from "./lib/session-hint";
import { DashboardPage } from "./pages/DashboardPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { JobDetailPage } from "./pages/JobDetailPage";
import { JobsPage } from "./pages/JobsPage";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { ShiftsPage } from "./pages/ShiftsPage";
import { SignupPage } from "./pages/SignupPage";
import { SummaryPage } from "./pages/SummaryPage";
import { useAuthStore } from "./store/auth-store";

function App() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const setInitialized = useAuthStore((state) => state.setInitialized);

  useEffect(() => {
    // A visitor who never signed in here has no session to restore, so there is
    // no reason to wait for the server (which may be waking up).
    if (!hasSessionHint()) {
      setInitialized();
      return;
    }
    refresh()
      .then(setAuth)
      .catch((error: unknown) => {
        // Stay logged out silently. Only a rejected session forgets the hint, so
        // a network or server hiccup does not sign the visitor out for good.
        if (error instanceof ApiError && error.status === 401) {
          clearAuth();
        }
      })
      .finally(setInitialized);
  }, [setAuth, clearAuth, setInitialized]);

  return (
    <ToastProvider>
      <Routes>
        <Route path={ROUTES.home} element={<LandingPage />} />
        <Route path={ROUTES.login} element={<LoginPage />} />
        <Route path={ROUTES.signup} element={<SignupPage />} />
        <Route path={ROUTES.forgotPassword} element={<ForgotPasswordPage />} />
        <Route path={ROUTES.resetPassword} element={<ResetPasswordPage />} />
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
    </ToastProvider>
  );
}

export default App;
