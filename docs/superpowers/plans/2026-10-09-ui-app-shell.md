# UI App Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Project rule: never run `git commit`, `git add`, `git push` or open a PR.** Every "Suggested commit" step is for the user to run. When a task is done, stop with a clean, verified working tree and report.

**Goal:** Replace the two-row header (title bar plus a separate link row and a loose Log out button) with a single modern top bar: brand, main navigation, and an account menu. Every logged-in page uses this shell, so all of them pick up the new look at once.

**Architecture:** `AppShell` keeps ownership of navigation links, logout behaviour (API call, clearing the session, redirecting to login), and the page container. A new presentational `AccountMenu` shows the user and a Log out action. Everything is styled with the design tokens and the shared `Button` and `Card` from Plan 1. No page file changes.

**Tech Stack:** React 19, React Router 7, TypeScript (strict), Tailwind v4 tokens, Vitest, Testing Library, jest-axe, Zustand (existing auth store).

**Spec:** `docs/superpowers/specs/2026-10-09-ui-redesign-design.md` (section 3, "App shell"; delivery step 3). Depends on Plan 1 (`docs/superpowers/plans/2026-10-09-ui-foundation-and-components.md`) being merged.

## Global Constraints

- Work in `frontend/`. Branch for this plan: `feature/ui-shell` from an up-to-date `staging` (after the foundation PR is merged). Only the user creates branches, commits and pushes.
- Token utilities only (`bg-surface`, `text-ink`, `border-border`, ...). No raw colours, no `slate-*`, no hex values.
- Interactive controls are at least 44 px tall (`min-h-11`).
- Active nav link: accent text with an accent underline, plus `aria-current="page"` (already provided by `NavLink`). Colour is never the only cue: the underline marks the active link too.
- The skip-to-content link stays and still targets `#main-content`.
- On phones the nav links scroll horizontally on their own row under the brand; on `sm` and wider everything sits in one row.
- Behaviour is unchanged: same four links (`Dashboard`, `Jobs`, `Shifts`, `Summary`) from `ROUTES`, same logout flow (call the API; clear the session and go to the login page even if the call fails).
- Verification commands, all run in `frontend/`: `npx tsc -b`, `npm run build` (then `rm -rf dist`), `npx eslint src`, `npx vitest run`. (`tsc --noEmit -p .` checks nothing here.)
- Code style: match the surrounding code (double quotes, 2-space indent, Prettier). Run `npx prettier --write <files>` before finishing a task.

## File Structure

Create:
- `src/components/layout/AccountMenu.tsx`, `src/components/layout/AccountMenu.test.tsx`

Modify:
- `src/components/layout/AppShell.tsx`: new layout, uses `AccountMenu`.
- `src/components/layout/AppShell.test.tsx`: keeps the existing navigation tests and adds layout, account and logout tests.

Not touched: any page, `ROUTES`, the auth store, `auth-api`.

---

### Task 1: AccountMenu

**Files:**
- Create: `src/components/layout/AccountMenu.tsx`
- Test: `src/components/layout/AccountMenu.test.tsx`

**Interfaces:**
- Consumes: `Button` from `../ui/Button` (variant `secondary`, size `compact`, `className` is appended), `cardClassName` from `../ui/Card`.
- Produces: `AccountMenu({ name: string; email?: string; onLogout: () => void })`.
  - A trigger button with `aria-expanded`. Its accessible name is `Account menu: <name>`; on phones only the initial circle is visible, on `sm` and wider the name is visible too.
  - When open, a panel (the trigger's `aria-controls` target) with the name, the optional email and a `Log out` button. The panel is a disclosure, not an ARIA `menu`, so no arrow-key handling is needed.
  - Escape closes the panel and returns focus to the trigger. A pointer press outside closes it. Pressing `Log out` closes it and calls `onLogout`.

- [ ] **Step 1: Write the failing test `src/components/layout/AccountMenu.test.tsx`**

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AccountMenu } from "./AccountMenu";

function renderMenu(props: { email?: string } = {}) {
  const onLogout = vi.fn();
  render(
    <div>
      <AccountMenu name="Md Moinuddin" onLogout={onLogout} {...props} />
      <button type="button">Outside</button>
    </div>,
  );
  return { onLogout };
}

function trigger() {
  return screen.getByRole("button", { name: /Account menu: Md Moinuddin/ });
}

describe("AccountMenu", () => {
  it("is closed at first", () => {
    renderMenu();

    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    expect(trigger().getAttribute("aria-controls")).toBeNull();
    expect(screen.queryByRole("button", { name: "Log out" })).toBeNull();
  });

  it("shows the initial in a decorative circle", () => {
    renderMenu();

    const initial = screen.getByText("M", { selector: "span" });
    expect(initial.getAttribute("aria-hidden")).toBe("true");
  });

  it("opens on press and links the trigger to the panel", () => {
    renderMenu({ email: "md@example.com" });

    fireEvent.click(trigger());

    expect(trigger().getAttribute("aria-expanded")).toBe("true");
    const panelId = trigger().getAttribute("aria-controls");
    expect(panelId).not.toBeNull();
    expect(document.getElementById(panelId as string)).not.toBeNull();
    expect(screen.getByText("md@example.com")).toBeDefined();
    expect(screen.getByRole("button", { name: "Log out" })).toBeDefined();
  });

  it("does not show an email line when there is no email", () => {
    renderMenu();

    fireEvent.click(trigger());

    expect(screen.queryByText(/@/)).toBeNull();
  });

  it("closes when the trigger is pressed again", () => {
    renderMenu();

    fireEvent.click(trigger());
    fireEvent.click(trigger());

    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("button", { name: "Log out" })).toBeNull();
  });

  it("closes on Escape and gives focus back to the trigger", () => {
    renderMenu();
    fireEvent.click(trigger());
    screen.getByRole("button", { name: "Log out" }).focus();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("button", { name: "Log out" })).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it("closes when the pointer is pressed outside", () => {
    renderMenu();
    fireEvent.click(trigger());

    fireEvent.pointerDown(screen.getByRole("button", { name: "Outside" }));

    expect(screen.queryByRole("button", { name: "Log out" })).toBeNull();
  });

  it("stays open when the pointer is pressed inside the panel", () => {
    renderMenu({ email: "md@example.com" });
    fireEvent.click(trigger());

    fireEvent.pointerDown(screen.getByText("md@example.com"));

    expect(screen.getByRole("button", { name: "Log out" })).toBeDefined();
  });

  it("calls onLogout and closes when Log out is pressed", () => {
    const { onLogout } = renderMenu();
    fireEvent.click(trigger());

    fireEvent.click(screen.getByRole("button", { name: "Log out" }));

    expect(onLogout).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "Log out" })).toBeNull();
  });
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `npx vitest run src/components/layout/AccountMenu.test.tsx`
Expected: FAIL, cannot find `./AccountMenu`.

- [ ] **Step 3: Implement `src/components/layout/AccountMenu.tsx`**

```tsx
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "../ui/Button";
import { cardClassName } from "../ui/Card";

interface AccountMenuProps {
  name: string;
  email?: string;
  onLogout: () => void;
}

export function AccountMenu({ name, email, onLogout }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: Event) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function handleLogout() {
    setOpen(false);
    onLogout();
  }

  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-11 items-center gap-2 rounded-control px-2 text-sm font-medium text-ink hover:bg-page"
      >
        <span
          aria-hidden="true"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent-ink"
        >
          {initial}
        </span>
        <span className="sr-only">Account menu: </span>
        <span className="max-sm:sr-only sm:max-w-[10rem] sm:truncate">
          {name}
        </span>
      </button>

      {open && (
        <div
          id={panelId}
          className={cardClassName(
            "plain",
            "absolute right-0 top-full z-20 mt-2 w-64 p-3",
          )}
        >
          <p className="truncate text-sm font-semibold text-ink">{name}</p>
          {email && <p className="truncate text-sm text-ink-muted">{email}</p>}
          <Button
            variant="secondary"
            size="compact"
            className="mt-3 w-full"
            onClick={handleLogout}
          >
            Log out
          </Button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run it, typecheck, lint, format**

Run: `npx prettier --write src/components/layout/AccountMenu.tsx src/components/layout/AccountMenu.test.tsx && npx vitest run src/components/layout/AccountMenu.test.tsx && npx tsc -b && npx eslint src`
Expected: 9 tests pass, no other output. If `fireEvent.pointerDown` is not dispatched as a `pointerdown` event in jsdom, replace the test's call with `fireEvent(target, new Event("pointerdown", { bubbles: true }))`; do not change the component to make the test pass.

- [ ] **Step 5: Suggested commit (user runs it)**

```bash
git add frontend/src/components/layout/AccountMenu.tsx frontend/src/components/layout/AccountMenu.test.tsx
git commit -m "feat(frontend): add the account menu with a log out action"
```

---

### Task 2: AppShell layout

**Files:**
- Modify: `src/components/layout/AppShell.tsx` (whole file)
- Modify: `src/components/layout/AppShell.test.tsx` (whole file)

**Interfaces:**
- Consumes: `AccountMenu` (Task 1), `ROUTES` from `../../lib/routes`, `logout` from `../../lib/auth-api`, `useAuthStore` from `../../store/auth-store` (`user` has `name` and `email`; `clearAuth()`), React Router `NavLink` and `useNavigate`.
- Produces: `AppShell({ children })`, same props as before. Landmarks: a `<header>`, a `<nav aria-label="Main">`, and `<main id="main-content">`.

- [ ] **Step 1: Replace `src/components/layout/AppShell.test.tsx`**

```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { logout } from "../../lib/auth-api";
import { useAuthStore } from "../../store/auth-store";
import { AppShell } from "./AppShell";

vi.mock("../../lib/auth-api", () => ({ logout: vi.fn() }));

const user = {
  id: "user-1",
  name: "Md Moinuddin",
  email: "md@example.com",
  createdAt: "2026-10-01T09:00:00.000Z",
};

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<p>Login page</p>} />
        <Route
          path="*"
          element={
            <AppShell>
              <p>content</p>
            </AppShell>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(logout).mockResolvedValue(undefined);
  useAuthStore.setState({ user, accessToken: "token" });
});

afterEach(() => {
  useAuthStore.getState().clearAuth();
});

describe("AppShell navigation", () => {
  it.each([
    ["/dashboard", "Dashboard"],
    ["/jobs", "Jobs"],
    ["/shifts", "Shifts"],
    ["/summary", "Summary"],
  ])("marks the link of the current page (%s)", (path, label) => {
    renderAt(path);

    const link = screen.getByRole("link", { name: label });
    expect(link.getAttribute("aria-current")).toBe("page");
  });

  it("marks no link on other pages", () => {
    renderAt("/somewhere-else");

    for (const label of ["Dashboard", "Jobs", "Shifts", "Summary"]) {
      const link = screen.getByRole("link", { name: label });
      expect(link.getAttribute("aria-current")).toBeNull();
    }
  });

  it("has one main navigation with the four links in order", () => {
    renderAt("/dashboard");

    const nav = screen.getByRole("navigation", { name: "Main" });
    const labels = Array.from(nav.querySelectorAll("a")).map(
      (link) => link.textContent,
    );
    expect(labels).toEqual(["Dashboard", "Jobs", "Shifts", "Summary"]);
  });

  it("underlines the current link as well as colouring it", () => {
    renderAt("/jobs");

    expect(screen.getByRole("link", { name: "Jobs" }).className).toContain(
      "border-accent",
    );
    expect(screen.getByRole("link", { name: "Shifts" }).className).toContain(
      "border-transparent",
    );
  });
});

describe("AppShell layout", () => {
  it("shows the brand and the page content", () => {
    renderAt("/dashboard");

    expect(screen.getByText("Life Tracker")).toBeDefined();
    expect(screen.getByText("content")).toBeDefined();
  });

  it("has a skip link that targets the main content", () => {
    renderAt("/dashboard");

    const skip = screen.getByRole("link", { name: "Skip to content" });
    expect(skip.getAttribute("href")).toBe("#main-content");
    expect(screen.getByRole("main").id).toBe("main-content");
  });
});

describe("AppShell account", () => {
  it("shows the signed-in user in the account menu", () => {
    renderAt("/dashboard");

    fireEvent.click(screen.getByRole("button", { name: /Account menu/ }));

    expect(screen.getByText("md@example.com")).toBeDefined();
  });

  it("logs out through the API, clears the session and goes to the login page", async () => {
    renderAt("/dashboard");
    fireEvent.click(screen.getByRole("button", { name: /Account menu/ }));

    fireEvent.click(screen.getByRole("button", { name: "Log out" }));

    expect(await screen.findByText("Login page")).toBeDefined();
    expect(logout).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("still clears the session and leaves when the logout request fails", async () => {
    vi.mocked(logout).mockRejectedValue(new Error("network down"));
    renderAt("/dashboard");
    fireEvent.click(screen.getByRole("button", { name: /Account menu/ }));

    fireEvent.click(screen.getByRole("button", { name: "Log out" }));

    await waitFor(() => expect(screen.getByText("Login page")).toBeDefined());
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("copes with a missing user", () => {
    useAuthStore.getState().clearAuth();
    renderAt("/dashboard");

    expect(screen.getByRole("button", { name: /Account menu/ })).toBeDefined();
  });
});

describe("AppShell accessibility", () => {
  it("has no violations with the account menu closed or open", async () => {
    const { container } = renderAt("/dashboard");
    expect((await axe(container)).violations).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: /Account menu/ }));
    expect((await axe(container)).violations).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `npx vitest run src/components/layout/AppShell.test.tsx`
Expected: FAIL (no navigation named "Main", no "Account menu" button, no underline class). The four `aria-current` tests may still pass; that is fine.

- [ ] **Step 3: Replace `src/components/layout/AppShell.tsx`**

```tsx
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
          <span className="flex min-h-11 items-center gap-2 text-base font-bold tracking-tight text-ink">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 rotate-45 rounded-sm bg-accent"
            />
            Life Tracker
          </span>
          <nav
            aria-label="Main"
            className="order-last -mx-4 w-[calc(100%+2rem)] overflow-x-auto px-4 sm:order-none sm:mx-0 sm:w-auto sm:flex-1 sm:overflow-visible sm:px-0"
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
```

- [ ] **Step 4: Run it, typecheck, lint, format**

Run: `npx prettier --write src/components/layout/AppShell.tsx src/components/layout/AppShell.test.tsx && npx vitest run src/components/layout && npx tsc -b && npx eslint src`
Expected: all layout tests pass (AccountMenu 9, AppShell 14), no other output. If axe reports a violation, fix the component it points to and say what you changed; never weaken the test.

- [ ] **Step 5: Suggested commit (user runs it)**

```bash
git add frontend/src/components/layout/AppShell.tsx frontend/src/components/layout/AppShell.test.tsx
git commit -m "feat(frontend): redesign the app shell as a single top bar with an account menu"
```

---

### Task 3: Check every page that uses the shell

**Files:** none created. This task only verifies and reports.

**Interfaces:**
- Consumes: `AppShell` (Task 2), which every logged-in page (`DashboardPage`, `JobsPage`, `JobDetailPage`, `ShiftsPage`, `SummaryPage`) renders.

- [ ] **Step 1: Run the page and accessibility tests**

Run: `npx vitest run src/pages`
Expected: all pass, including the existing `accessibility.test.tsx` (it renders `DashboardPage` inside the new shell through axe). If a page test fails because it looked for the old header text (for example a "Log out" button directly in the header), update that single assertion to open the account menu first (`fireEvent.click(screen.getByRole("button", { name: /Account menu/ }))`) and note which test you changed. Do not change any other assertion.

- [ ] **Step 2: Confirm nothing else referenced the old markup**

Run: `grep -rn "slate-" src/components/layout; grep -rn "Log out" src --include=*.tsx | grep -v "layout/"`
Expected: the first grep prints nothing (no raw slate colours left in the layout folder); the second prints nothing.

- [ ] **Step 3: Run the full CI set**

Run:
```bash
npx prettier --check src/components/layout
npx tsc -b && echo TSC_OK
npm run build 2>&1 | grep -E "built|error"
rm -rf dist
npx eslint src && echo LINT_OK
npx vitest run 2>&1 | grep -E "Test Files|Tests|FAIL"
git status --short
```
Expected: `TSC_OK`, `built in ...`, `LINT_OK`, all tests pass, and `git status` shows only `AccountMenu.tsx`, `AccountMenu.test.tsx`, `AppShell.tsx`, `AppShell.test.tsx` (plus any one-line page-test edit from Step 1).

- [ ] **Step 4: Browser pass (the user does this)**

After starting the app, check on every logged-in page (Dashboard, Jobs, a job's detail page, Shifts, Summary):
1. The top bar shows the brand, the four links and your initial. The current page's link is blue with an underline.
2. At a phone width (about 360 px), the links sit on their own row under the brand and scroll sideways; the whole page does not scroll sideways.
3. Press `Tab` from the top of a page: the first stop is "Skip to content", then the brand is skipped, then each link, then the account button. Every stop has a visible focus ring.
4. Open the account menu with Enter or Space: it shows your name, email and Log out. `Escape` closes it and puts focus back on the button; clicking elsewhere closes it too.
5. Log out takes you to the login page, and going back does not show the pages again.

- [ ] **Step 5: Suggested commit (user runs it)**

Only if Step 1 changed a page test:
```bash
git add frontend/src/pages
git commit -m "test(frontend): open the account menu in page tests that log out"
```
Then push the branch and open the PR into `staging`.
