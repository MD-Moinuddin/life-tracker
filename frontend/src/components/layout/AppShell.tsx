import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { classNames } from "../../lib/class-names";
import { logout } from "../../lib/auth-api";
import { endDemoSession } from "../../lib/demo/demo-session";
import { ROUTES } from "../../lib/routes";
import { useAuthStore } from "../../store/auth-store";
import { Icon } from "../ui/Icon";
import type { IconName } from "../ui/Icon";
import { AccountMenu } from "./AccountMenu";
import { BrandLink } from "./BrandLink";
import { DemoBanner } from "./DemoBanner";

interface AppShellProps {
  children: ReactNode;
}

// The one list of main pages. Below md they are the tabs of a bar fixed to the
// bottom of the screen, where a thumb reaches; from md up they are links in the
// header.
const NAV_LINKS: { to: string; label: string; icon: IconName }[] = [
  { to: ROUTES.dashboard, label: "Dashboard", icon: "layout-dashboard" },
  { to: ROUTES.jobs, label: "Jobs", icon: "briefcase" },
  { to: ROUTES.shifts, label: "Shifts", icon: "clock" },
  { to: ROUTES.summary, label: "Summary", icon: "bar-chart" },
];

const NAV_LINK_BASE_CLASSES =
  "flex items-center whitespace-nowrap font-medium transition-colors max-md:min-h-14 max-md:w-full max-md:flex-col max-md:justify-center max-md:gap-0.5 max-md:text-xs md:min-h-11 md:border-b-2 md:px-3 md:text-sm";

function navLinkClassName({ isActive }: { isActive: boolean }) {
  return isActive
    ? `${NAV_LINK_BASE_CLASSES} border-accent text-accent max-md:font-bold`
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
      navigate(ROUTES.home);
    }
  }

  function handleExitDemo(to: string) {
    endDemoSession();
    navigate(to);
  }

  const isDemo = user?.isDemo === true;

  return (
    <div className="min-h-screen bg-page">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-control focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-on-accent"
      >
        Skip to content
      </a>
      {isDemo && (
        <DemoBanner
          onExit={() => handleExitDemo(ROUTES.home)}
          onSignUp={() => handleExitDemo(ROUTES.signup)}
        />
      )}
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 px-4 max-md:py-1 sm:px-6">
          <BrandLink to={ROUTES.dashboard} className="min-h-11 text-base" />
          <nav
            aria-label="Main"
            className="max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-20 max-md:h-tabbar max-md:border-t max-md:border-border max-md:bg-surface max-md:px-2 max-md:pt-1.5 max-md:pb-[env(safe-area-inset-bottom)] max-md:shadow-card md:flex-1"
          >
            <ul className="flex gap-1 max-md:justify-around">
              {NAV_LINKS.map(({ to, label, icon }) => (
                <li key={to} className="max-md:flex-1">
                  <NavLink to={to} className={navLinkClassName}>
                    {({ isActive }) => (
                      <>
                        <span
                          aria-hidden="true"
                          className={classNames(
                            "flex h-7.5 w-14 items-center justify-center rounded-full md:hidden",
                            isActive && "bg-accent-soft",
                          )}
                        >
                          <Icon name={icon} className="h-5.5 w-5.5" />
                        </span>
                        {label}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <AccountMenu
            name={user?.name ?? "Account"}
            email={user?.email}
            isDemo={isDemo}
            onLogout={isDemo ? () => handleExitDemo(ROUTES.home) : handleLogout}
          />
        </div>
      </header>
      {/* Below md the bottom bar covers the end of the page, so the page ends
          above it. */}
      <main
        id="main-content"
        className="mx-auto max-w-6xl px-4 py-8 max-md:pb-[calc(var(--spacing-tabbar)+2rem)] sm:px-6"
      >
        {children}
      </main>
    </div>
  );
}
