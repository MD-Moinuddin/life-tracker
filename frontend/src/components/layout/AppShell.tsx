import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { logout } from "../../lib/auth-api";
import { ROUTES } from "../../lib/routes";
import { useAuthStore } from "../../store/auth-store";
import { AccountMenu } from "./AccountMenu";

interface AppShellProps {
  children: ReactNode;
}

const NAV_LINKS = [
  { to: ROUTES.dashboard, label: "Dashboard" },
  { to: ROUTES.jobs, label: "Jobs" },
  { to: ROUTES.shifts, label: "Shifts" },
  { to: ROUTES.summary, label: "Summary" },
];

const NAV_LINK_BASE_CLASSES =
  "flex min-h-11 items-center whitespace-nowrap border-b-2 px-3 text-sm font-medium transition-colors";

function navLinkClassName({ isActive }: { isActive: boolean }) {
  return isActive
    ? `${NAV_LINK_BASE_CLASSES} border-accent text-accent`
    : `${NAV_LINK_BASE_CLASSES} border-transparent text-ink-muted hover:text-ink`;
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
      navigate(ROUTES.login);
    }
  }

  return (
    <div className="min-h-screen bg-page">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-control focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-on-accent"
      >
        Skip to content
      </a>
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 px-4 sm:px-6">
          <span className="flex min-h-11 shrink-0 items-center gap-2 text-base font-bold tracking-tight text-ink">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 rotate-45 rounded-sm bg-accent"
            />
            Life Tracker
          </span>
          <nav
            aria-label="Main"
            className="order-last -mx-4 w-[calc(100%+2rem)] overflow-x-auto px-4 py-1 md:order-none md:mx-0 md:w-auto md:flex-1 md:overflow-visible md:px-0 md:py-0"
          >
            <ul className="flex gap-1">
              {NAV_LINKS.map(({ to, label }) => (
                <li key={to}>
                  <NavLink to={to} className={navLinkClassName}>
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <AccountMenu
            name={user?.name ?? "Account"}
            email={user?.email}
            onLogout={handleLogout}
          />
        </div>
      </header>
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
