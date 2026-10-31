import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { SlowStartNotice } from "../SlowStartNotice";
import { ROUTES } from "../../lib/routes";
import { useAuthStore } from "../../store/auth-store";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  if (!isInitialized) {
    return (
      <div>
        <p>Loading…</p>
        <SlowStartNotice />
      </div>
    );
  }

  // No session, whatever the reason (never signed in, logged out, left the
  // demo, or reloaded the demo, which is never saved): the way in is the
  // homepage, which has Log in, Sign up and the demo.
  if (!accessToken) {
    return <Navigate to={ROUTES.home} replace />;
  }

  return children;
}
