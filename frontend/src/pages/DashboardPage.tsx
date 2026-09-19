import { useNavigate } from "react-router-dom";
import { logout } from "../lib/auth-api";
import { useAuthStore } from "../store/auth-store";

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // Best-effort: still clear the local session even if the request fails.
    } finally {
      clearAuth();
      navigate("/login");
    }
  }

  return (
    <div>
      <p>Logged in as {user?.email}</p>
      <button type="button" onClick={handleLogout}>
        Log out
      </button>
    </div>
  );
}
