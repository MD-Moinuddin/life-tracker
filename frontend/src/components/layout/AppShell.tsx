import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { logout } from "../../lib/auth-api";
import { useAuthStore } from "../../store/auth-store";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
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
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <span className="text-lg font-semibold text-slate-900">
          Life Tracker
        </span>
        <div className="flex items-center gap-3">
          <span className="max-w-[8rem] truncate text-sm text-slate-600 sm:max-w-none">
            {user?.name}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Log out
          </button>
        </div>
      </header>
      <nav className="border-b border-slate-200 bg-white px-4 py-2 sm:px-6">
        <Link
          to="/dashboard"
          aria-current="page"
          className="text-sm font-medium text-slate-900"
        >
          Dashboard
        </Link>
      </nav>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
