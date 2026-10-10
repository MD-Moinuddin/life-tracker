# UI Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Project rule: never run `git commit`, `git add`, `git push` or open a PR.** Every "Suggested commit" step is for the user to run. When a task is done, stop with a clean, verified working tree and report. Do not create or switch branches.

**Goal:** Redesign the Dashboard: a greeting by name, a "Week at a glance" card (planned earnings and hours for this week, how much is already worked, a link to the Summary), and module cards drawn with the shared icons, where Work Schedule is a link card and the others are dimmed with a "Coming later" badge.

**Architecture:** The page reuses the existing `useSummary` hook (week range, today's date, the browser's local time), so there is no new request code and no backend change. A presentational `WeekGlanceCard` renders the loading, error, empty and ready states through the shared `LoadBoundary`. Two tiny pure helpers (`greeting`, `progressPercent`) carry the only new logic. Two shared-component tweaks flagged by earlier reviews are made here because this page is where they first matter: one standard padding for content cards, and a text link style that follows the surrounding font size.

**Tech Stack:** React 19, React Router 7, TypeScript (strict), Tailwind v4 tokens, Vitest, Testing Library, jest-axe, Zustand.

**Spec:** `docs/superpowers/specs/2026-10-09-ui-redesign-design.md` (section 3, "Dashboard"; delivery step 5). Depends on the foundation, app shell and auth plans being merged.

## Global Constraints

- Work in `frontend/`. Branch for this plan: `feature/ui-dashboard` from an up-to-date `origin/staging`. Only the user creates branches, commits and pushes.
- No backend or API change: the card uses the existing `GET /api/summary` through `getSummary`/`useSummary`.
- Token utilities only. No emoji, no `slate-*`, `indigo-*`, `red-*` classes or hex values in the files this plan touches. Icons come from the shared `Icon` set (`calendar`, `activity`, `leaf`, `wallet`).
- Money is never added or multiplied in JavaScript: amounts come from the API as strings and are only formatted with `formatEuro`. Progress is computed from integer minutes.
- If the summary request fails, only the card shows a short message; the greeting and the module cards still render.
- Interactive controls are at least 44 px tall; the Work Schedule link card is a single link whose accessible name is exactly its title.
- Heading order: one `h1` (the greeting), `h2` for "Week at a glance" and for "Modules", `h3` for each module title.
- Verification commands, all run in `frontend/`: `npx tsc -b`, `npm run build` (then `rm -rf dist`), `npx eslint src`, `npx vitest run`. (`tsc --noEmit -p .` checks nothing here.)
- Code style: match the surrounding code (double quotes, 2-space indent, Prettier). Run `npx prettier --write <files>` before finishing a task.

## File Structure

Create:
- `src/lib/greeting.ts`, `src/lib/greeting.test.ts`
- `src/lib/progress.ts`, `src/lib/progress.test.ts`
- `src/components/dashboard/WeekGlanceCard.tsx`, `src/components/dashboard/WeekGlanceCard.test.tsx`
- `src/pages/DashboardPage.test.tsx`

Modify:
- `src/components/ui/Card.tsx`, `src/components/ui/Card.test.tsx` (standard padding)
- `src/components/ui/links.ts`, `src/components/ui/links.test.ts` (no forced font size)
- `src/components/dashboard/ModuleCard.tsx`, `src/components/dashboard/ModuleCard.test.tsx`
- `src/hooks/useSummary.ts` (also return `now`)
- `src/pages/DashboardPage.tsx`
- `src/pages/accessibility.test.tsx` (mock the summary request for the Dashboard)

---

### Task 1: One card padding and a text link that follows its surroundings

**Files:**
- Modify: `src/components/ui/Card.tsx`, `src/components/ui/Card.test.tsx`, `src/components/ui/links.ts`, `src/components/ui/links.test.ts`

**Interfaces:**
- Produces: `CARD_PADDING` (the string `"p-5"`, exported from `Card.tsx`) and a `padded?: boolean` prop on `Card` (default `false`). `padded` adds `CARD_PADDING`. `cardClassName` is unchanged, so link cards add the padding themselves with `CARD_PADDING`. The auth card (`p-6`) and the account menu (`p-3`) are deliberate exceptions and keep their own values.
- `LINK_CLASSES` loses `text-sm`: it becomes `"rounded font-medium text-accent hover:text-accent-hover"` so a link takes the size of the text around it. (The login and signup footer links already sit inside a `text-sm` paragraph, so they look the same.)

- [ ] **Step 1: Write the failing tests**

In `src/components/ui/Card.test.tsx`: change the import to `import { Card, CARD_PADDING, cardClassName } from "./Card";` and add inside `describe("Card", ...)`:
```tsx
  it("has no padding unless asked, so callers can choose their own", () => {
    render(<Card>Bare</Card>);

    expect(screen.getByText("Bare").className).not.toContain(CARD_PADDING);
  });

  it("adds the standard padding when padded", () => {
    render(<Card padded>Padded</Card>);

    expect(screen.getByText("Padded").className).toContain(CARD_PADDING);
  });

  it("keeps the standard padding next to extra classes", () => {
    render(
      <Card padded className="flex">
        Both
      </Card>,
    );

    const { className } = screen.getByText("Both");
    expect(className).toContain(CARD_PADDING);
    expect(className).toContain("flex");
  });

  it("exports the standard padding", () => {
    expect(CARD_PADDING).toBe("p-5");
  });
```
In `src/components/ui/links.test.ts` add:
```ts
it("sets no font size, so a link follows the text around it", () => {
  expect(LINK_CLASSES).not.toMatch(/\btext-(xs|sm|base|lg|xl)\b/);
});
```

- [ ] **Step 2: Run them and see them fail**

Run: `npx vitest run src/components/ui/Card.test.tsx src/components/ui/links.test.ts`
Expected: FAIL (no `CARD_PADDING` export, `text-sm` still in `LINK_CLASSES`).

- [ ] **Step 3: Implement**

`src/components/ui/Card.tsx` (whole file):
```tsx
import type { ComponentProps } from "react";
import { classNames } from "../../lib/class-names";

export type CardVariant = "plain" | "interactive";

const BASE = "rounded-card border border-border bg-surface shadow-card";
const INTERACTIVE = "transition-colors hover:border-accent hover:bg-page";

// The standard padding of a content card. Popovers and the login card choose
// their own on purpose.
export const CARD_PADDING = "p-5";

// Also used directly by link cards: <Link className={cardClassName("interactive", CARD_PADDING)}>.
export function cardClassName(
  variant: CardVariant = "plain",
  extra?: string,
): string {
  return classNames(BASE, variant === "interactive" && INTERACTIVE, extra);
}

interface CardProps extends ComponentProps<"div"> {
  variant?: CardVariant;
  padded?: boolean;
}

export function Card({
  variant = "plain",
  padded = false,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={cardClassName(
        variant,
        classNames(padded && CARD_PADDING, className),
      )}
      {...props}
    />
  );
}
```
`src/components/ui/links.ts` (whole file):
```ts
// The look of an inline text link. It takes its font size from the text around
// it, and focus styling comes from the global :focus-visible rule.
export const LINK_CLASSES =
  "rounded font-medium text-accent hover:text-accent-hover";
```

- [ ] **Step 4: Run, plus everything that uses the link style**

Run: `npx prettier --write src/components/ui/Card.tsx src/components/ui/Card.test.tsx src/components/ui/links.ts src/components/ui/links.test.ts && npx vitest run src/components/ui src/pages/LoginPage.test.tsx src/pages/SignupPage.test.tsx && npx tsc -b && npx eslint src`
Expected: all pass, no other output.

- [ ] **Step 5: Suggested commit (user runs it)**

```bash
git add frontend/src/components/ui/Card.tsx frontend/src/components/ui/Card.test.tsx frontend/src/components/ui/links.ts frontend/src/components/ui/links.test.ts
git commit -m "refactor(frontend): give content cards one standard padding and let text links follow their surroundings"
```

---

### Task 2: Greeting and progress helpers

**Files:**
- Create: `src/lib/greeting.ts`, `src/lib/greeting.test.ts`, `src/lib/progress.ts`, `src/lib/progress.test.ts`

**Interfaces:**
- Produces: `greeting(now: string, name?: string): string` where `now` is `YYYY-MM-DDTHH:mm`; returns `"Good morning"` (hours 0 to 11), `"Good afternoon"` (12 to 17) or `"Good evening"` (18 to 23), followed by `", <first name>"` when a non-blank name is given. And `progressPercent(done: number, total: number): number`, an integer from 0 to 100 (0 when `total` is 0 or less; capped at 100).

- [ ] **Step 1: Write the failing tests**

`src/lib/greeting.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { greeting } from "./greeting";

describe("greeting", () => {
  it.each([
    ["2026-10-07T00:00", "Good morning"],
    ["2026-10-07T05:30", "Good morning"],
    ["2026-10-07T11:59", "Good morning"],
    ["2026-10-07T12:00", "Good afternoon"],
    ["2026-10-07T17:59", "Good afternoon"],
    ["2026-10-07T18:00", "Good evening"],
    ["2026-10-07T23:59", "Good evening"],
  ])("at %s says %s", (now, expected) => {
    expect(greeting(now)).toBe(expected);
  });

  it("adds the first name", () => {
    expect(greeting("2026-10-07T19:30", "Md Moinuddin")).toBe(
      "Good evening, Md",
    );
  });

  it("ignores extra spaces around the name", () => {
    expect(greeting("2026-10-07T09:00", "  Md   Moinuddin ")).toBe(
      "Good morning, Md",
    );
  });

  it("leaves the name out when it is missing or blank", () => {
    expect(greeting("2026-10-07T09:00", undefined)).toBe("Good morning");
    expect(greeting("2026-10-07T09:00", "")).toBe("Good morning");
    expect(greeting("2026-10-07T09:00", "   ")).toBe("Good morning");
  });
});
```
`src/lib/progress.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { progressPercent } from "./progress";

describe("progressPercent", () => {
  it("is the rounded share of the total", () => {
    expect(progressPercent(480, 1230)).toBe(39);
    expect(progressPercent(1, 3)).toBe(33);
    expect(progressPercent(2, 3)).toBe(67);
  });

  it("is 0 and 100 at the ends", () => {
    expect(progressPercent(0, 600)).toBe(0);
    expect(progressPercent(600, 600)).toBe(100);
  });

  it("never goes above 100 or below 0", () => {
    expect(progressPercent(700, 600)).toBe(100);
    expect(progressPercent(-5, 600)).toBe(0);
  });

  it("is 0 when there is nothing to complete", () => {
    expect(progressPercent(0, 0)).toBe(0);
    expect(progressPercent(10, 0)).toBe(0);
    expect(progressPercent(10, -1)).toBe(0);
  });
});
```

- [ ] **Step 2: Run them and see them fail**

Run: `npx vitest run src/lib/greeting.test.ts src/lib/progress.test.ts`
Expected: FAIL, cannot find the modules.

- [ ] **Step 3: Implement**

`src/lib/greeting.ts`:
```ts
// "Good evening, Md": the time-of-day greeting for the Dashboard. `now` is the
// browser's wall-clock time as YYYY-MM-DDTHH:mm.
export function greeting(now: string, name?: string): string {
  const hour = Number(now.slice(11, 13));
  const part =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = name?.trim().split(/\s+/)[0];
  return firstName ? `${part}, ${firstName}` : part;
}
```
`src/lib/progress.ts`:
```ts
// A whole-number percentage for a progress bar. It works on counts such as
// minutes, never on money.
export function progressPercent(done: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round((done / total) * 100)));
}
```

- [ ] **Step 4: Run, typecheck, lint, format**

Run: `npx prettier --write src/lib/greeting.ts src/lib/greeting.test.ts src/lib/progress.ts src/lib/progress.test.ts && npx vitest run src/lib/greeting.test.ts src/lib/progress.test.ts && npx tsc -b && npx eslint src`
Expected: all pass (greeting 11, progress 4), no other output.

- [ ] **Step 5: Suggested commit (user runs it)**

```bash
git add frontend/src/lib/greeting.ts frontend/src/lib/greeting.test.ts frontend/src/lib/progress.ts frontend/src/lib/progress.test.ts
git commit -m "feat(frontend): add the time-of-day greeting and progress percentage helpers"
```

---

### Task 3: Module cards with shared icons

**Files:**
- Modify: `src/components/dashboard/ModuleCard.tsx` (whole file), `src/components/dashboard/ModuleCard.test.tsx` (whole file), `src/pages/DashboardPage.tsx` (only the `MODULES` list and one import, so the page keeps compiling; Task 5 rewrites the rest)

**Interfaces:**
- Consumes: `Card`, `CARD_PADDING`, `cardClassName` (Task 1), `Badge`, `Icon`/`IconName`, `classNames`.
- Produces: `ModuleCard({ icon: IconName; title: string; to?: string })`. With `to`: a single `<Link>` card whose accessible name is exactly `title` (the icon is decorative). Without `to`: a dimmed plain card with the `Coming later` badge and no link.

- [ ] **Step 1: Replace `src/components/dashboard/ModuleCard.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ModuleCard } from "./ModuleCard";

function renderCard(to?: string) {
  render(
    <MemoryRouter>
      <ModuleCard icon="calendar" title="Work Schedule" to={to} />
    </MemoryRouter>,
  );
}

describe("ModuleCard", () => {
  it("links into the module and has no badge when it has a destination", () => {
    renderCard("/shifts");

    const link = screen.getByRole("link", { name: "Work Schedule" });
    expect(link.getAttribute("href")).toBe("/shifts");
    expect(screen.queryByText("Coming later")).toBeNull();
  });

  it("is a plain card with a Coming later badge when it has no destination", () => {
    renderCard();

    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("Coming later")).toBeDefined();
  });

  it("has the module title as a level 3 heading in both cases", () => {
    renderCard("/shifts");
    expect(
      screen.getByRole("heading", { level: 3, name: "Work Schedule" }),
    ).toBeDefined();
  });

  it("draws a decorative icon in both cases", () => {
    const { container, unmount } = render(
      <MemoryRouter>
        <ModuleCard icon="wallet" title="Finance" />
      </MemoryRouter>,
    );
    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe(
      "true",
    );
    unmount();

    const linked = render(
      <MemoryRouter>
        <ModuleCard icon="calendar" title="Work Schedule" to="/shifts" />
      </MemoryRouter>,
    );
    expect(
      linked.container.querySelector("svg")?.getAttribute("aria-hidden"),
    ).toBe("true");
  });

  it("dims the placeholder and highlights the real module", () => {
    const { container, unmount } = render(
      <MemoryRouter>
        <ModuleCard icon="leaf" title="Nutrition" />
      </MemoryRouter>,
    );
    expect(screen.getByText("Nutrition").className).toContain("text-ink-muted");
    expect(container.innerHTML).toContain("bg-neutral-soft");
    unmount();

    render(
      <MemoryRouter>
        <ModuleCard icon="calendar" title="Work Schedule" to="/shifts" />
      </MemoryRouter>,
    );
    expect(screen.getByText("Work Schedule").className).toContain("text-ink");
    expect(screen.getByText("Work Schedule").className).not.toContain(
      "text-ink-muted",
    );
  });

  it("uses the standard card padding", () => {
    renderCard("/shifts");

    expect(screen.getByRole("link").className).toContain("p-5");
  });
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `npx vitest run src/components/dashboard/ModuleCard.test.tsx`
Expected: FAIL (the component still takes an emoji string and has no heading/icon structure; TypeScript also rejects `icon="calendar"` until `IconName` is used).

- [ ] **Step 3: Replace `src/components/dashboard/ModuleCard.tsx`**

```tsx
import { Link } from "react-router-dom";
import { classNames } from "../../lib/class-names";
import { Badge } from "../ui/Badge";
import { Card, CARD_PADDING, cardClassName } from "../ui/Card";
import { Icon } from "../ui/Icon";
import type { IconName } from "../ui/Icon";

interface ModuleCardProps {
  icon: IconName;
  title: string;
  to?: string;
}

const LAYOUT = "flex flex-col items-start gap-3";

export function ModuleCard({ icon, title, to }: ModuleCardProps) {
  if (to) {
    return (
      <Link
        to={to}
        className={cardClassName(
          "interactive",
          classNames(CARD_PADDING, LAYOUT),
        )}
      >
        <span className="rounded-control bg-accent-soft p-2 text-accent-ink">
          <Icon name={icon} />
        </span>
        <h3 className="text-base font-semibold text-ink">{title}</h3>
      </Link>
    );
  }

  return (
    <Card padded className={LAYOUT}>
      <span className="rounded-control bg-neutral-soft p-2 text-ink-muted">
        <Icon name={icon} />
      </span>
      <h3 className="text-base font-semibold text-ink-muted">{title}</h3>
      <Badge>Coming later</Badge>
    </Card>
  );
}
```

- [ ] **Step 4: Keep the page compiling**

In `src/pages/DashboardPage.tsx`, add `import type { IconName } from "../components/ui/Icon";` and replace the `MODULES` constant with a typed list (the emoji strings are no longer valid icons). Change nothing else in the file:
```tsx
const MODULES: { icon: IconName; title: string; to?: string }[] = [
  { icon: "calendar", title: "Work Schedule", to: ROUTES.shifts },
  { icon: "activity", title: "Fitness" },
  { icon: "leaf", title: "Nutrition" },
  { icon: "wallet", title: "Finance" },
];
```

- [ ] **Step 5: Run, typecheck, lint, format**

Run: `npx prettier --write src/components/dashboard src/pages/DashboardPage.tsx && npx vitest run src/components/dashboard/ModuleCard.test.tsx src/pages/accessibility.test.tsx && npx tsc -b && npx eslint src`
Expected: all pass, no other output. (The accessibility test for the Dashboard still passes here; Task 5 adds the network mock it needs once the page starts requesting the summary.)

- [ ] **Step 6: Suggested commit (user runs it)**

```bash
git add frontend/src/components/dashboard/ModuleCard.tsx frontend/src/components/dashboard/ModuleCard.test.tsx frontend/src/pages/DashboardPage.tsx
git commit -m "feat(frontend): draw the dashboard module cards with the shared icons"
```

---

### Task 4: The Week at a glance card

**Files:**
- Create: `src/components/dashboard/WeekGlanceCard.tsx`, `src/components/dashboard/WeekGlanceCard.test.tsx`

**Interfaces:**
- Consumes: `LoadState` from `../../hooks/useLoad`, `Summary` from `../../lib/summary-api` (`from`, `to`, `jobs[]`, `totals: { earnedMinutes, plannedMinutes, earnedAmount, plannedAmount }`), `LoadBoundary`, `Card` (`padded`), `LINK_CLASSES`, `formatEuro`, `formatDuration`, `formatDateRange`, `progressPercent`, `ROUTES`.
- Produces: `WeekGlanceCard({ state: LoadState<Summary> })`. It always shows the `h2` "Week at a glance". Loading: "Loading your week…". Error: the shared alert text "Could not load your week. Refresh the page to try again.". Ready with no jobs: "No shifts this week yet." and an "Add a shift" link to `ROUTES.shifts`. Ready with jobs: the week range, the planned amount (large), "planned this week · <hours>", a `role="progressbar"` of worked time (`aria-valuemin` 0, `aria-valuemax` planned minutes, `aria-valuenow` earned minutes, `aria-valuetext` like "8h of 20h 30m", `aria-label` "Hours worked so far"), "<earned amount> earned so far · <hours>", and a "View summary" link to `ROUTES.summary`.

- [ ] **Step 1: Write the failing test `src/components/dashboard/WeekGlanceCard.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { LoadState } from "../../hooks/useLoad";
import type { Summary } from "../../lib/summary-api";
import { WeekGlanceCard } from "./WeekGlanceCard";

const summary: Summary = {
  from: "2026-10-05",
  to: "2026-10-11",
  jobs: [
    {
      jobId: "job-1",
      name: "Warehouse",
      type: "part_time",
      hourlyRate: "12.00",
      earnedMinutes: 480,
      plannedMinutes: 1230,
      earnedAmount: "96.00",
      plannedAmount: "252.75",
    },
  ],
  totals: {
    earnedMinutes: 480,
    plannedMinutes: 1230,
    earnedAmount: "96.00",
    plannedAmount: "252.75",
  },
};

function renderCard(state: LoadState<Summary>) {
  render(
    <MemoryRouter>
      <WeekGlanceCard state={state} />
    </MemoryRouter>,
  );
}

describe("WeekGlanceCard", () => {
  it("always has its heading", () => {
    for (const state of [
      { status: "loading" },
      { status: "error" },
      { status: "ready", data: summary },
    ] as LoadState<Summary>[]) {
      const { unmount } = render(
        <MemoryRouter>
          <WeekGlanceCard state={state} />
        </MemoryRouter>,
      );
      expect(
        screen.getByRole("heading", { level: 2, name: "Week at a glance" }),
      ).toBeDefined();
      unmount();
    }
  });

  it("says it is loading", () => {
    renderCard({ status: "loading" });

    expect(screen.getByText("Loading your week…")).toBeDefined();
  });

  it("shows a short message when the week cannot be loaded", () => {
    renderCard({ status: "error" });

    expect(screen.getByRole("alert").textContent).toBe(
      "Could not load your week. Refresh the page to try again.",
    );
  });

  it("shows the week, the planned amount and hours, and what is already worked", () => {
    renderCard({ status: "ready", data: summary });

    expect(screen.getByText("5 Oct to 11 Oct 2026")).toBeDefined();
    expect(screen.getByText("€252.75")).toBeDefined();
    expect(screen.getByText("planned this week · 20h 30m")).toBeDefined();
    expect(screen.getByText("€96.00 earned so far · 8h")).toBeDefined();
  });

  it("shows worked time as an accessible progress bar", () => {
    renderCard({ status: "ready", data: summary });

    const bar = screen.getByRole("progressbar", {
      name: "Hours worked so far",
    });
    expect(bar.getAttribute("aria-valuemin")).toBe("0");
    expect(bar.getAttribute("aria-valuemax")).toBe("1230");
    expect(bar.getAttribute("aria-valuenow")).toBe("480");
    expect(bar.getAttribute("aria-valuetext")).toBe("8h of 20h 30m");
    expect(bar.firstElementChild?.getAttribute("style")).toContain("39%");
  });

  it("links to the full summary", () => {
    renderCard({ status: "ready", data: summary });

    expect(
      screen.getByRole("link", { name: "View summary" }).getAttribute("href"),
    ).toBe("/summary");
  });

  it("invites the user to add a shift when the week is empty", () => {
    renderCard({
      status: "ready",
      data: {
        ...summary,
        jobs: [],
        totals: {
          earnedMinutes: 0,
          plannedMinutes: 0,
          earnedAmount: "0.00",
          plannedAmount: "0.00",
        },
      },
    });

    expect(screen.getByText(/No shifts this week yet/)).toBeDefined();
    expect(
      screen.getByRole("link", { name: "Add a shift" }).getAttribute("href"),
    ).toBe("/shifts");
    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(screen.queryByRole("link", { name: "View summary" })).toBeNull();
  });
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `npx vitest run src/components/dashboard/WeekGlanceCard.test.tsx`
Expected: FAIL, cannot find `./WeekGlanceCard`.

- [ ] **Step 3: Implement `src/components/dashboard/WeekGlanceCard.tsx`**

```tsx
import { Link } from "react-router-dom";
import type { LoadState } from "../../hooks/useLoad";
import { classNames } from "../../lib/class-names";
import { formatEuro } from "../../lib/money";
import { progressPercent } from "../../lib/progress";
import { ROUTES } from "../../lib/routes";
import { formatDateRange, formatDuration } from "../../lib/shift-format";
import type { Summary } from "../../lib/summary-api";
import { LoadBoundary } from "../LoadBoundary";
import { Card } from "../ui/Card";
import { LINK_CLASSES } from "../ui/links";

interface WeekGlanceCardProps {
  state: LoadState<Summary>;
}

function WeekContent({ summary }: { summary: Summary }) {
  const { totals } = summary;

  if (summary.jobs.length === 0) {
    return (
      <p className="text-sm text-ink-muted">
        No shifts this week yet.{" "}
        <Link to={ROUTES.shifts} className={LINK_CLASSES}>
          Add a shift
        </Link>
      </p>
    );
  }

  const percent = progressPercent(totals.earnedMinutes, totals.plannedMinutes);

  return (
    <>
      <p className="text-sm text-ink-muted">
        {formatDateRange(summary.from, summary.to)}
      </p>
      <p className="mt-3 text-title font-bold tracking-tight text-ink">
        {formatEuro(totals.plannedAmount)}
      </p>
      <p className="text-sm text-ink-muted">
        {`planned this week · ${formatDuration(totals.plannedMinutes)}`}
      </p>
      <div
        role="progressbar"
        aria-label="Hours worked so far"
        aria-valuemin={0}
        aria-valuemax={totals.plannedMinutes}
        aria-valuenow={totals.earnedMinutes}
        aria-valuetext={`${formatDuration(totals.earnedMinutes)} of ${formatDuration(totals.plannedMinutes)}`}
        className="mt-3 h-2 rounded-full bg-neutral-soft"
      >
        <div
          className="h-2 rounded-full bg-accent"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-2 text-sm text-ink-muted">
        {`${formatEuro(totals.earnedAmount)} earned so far · ${formatDuration(totals.earnedMinutes)}`}
      </p>
      <Link
        to={ROUTES.summary}
        className={classNames(LINK_CLASSES, "mt-3 inline-block text-sm")}
      >
        View summary
      </Link>
    </>
  );
}

export function WeekGlanceCard({ state }: WeekGlanceCardProps) {
  return (
    <Card padded>
      <h2 className="mb-1 text-section font-semibold text-ink">
        Week at a glance
      </h2>
      <LoadBoundary state={state} noun="your week">
        {(summary) => <WeekContent summary={summary} />}
      </LoadBoundary>
    </Card>
  );
}
```

- [ ] **Step 4: Run, typecheck, lint, format**

Run: `npx prettier --write src/components/dashboard/WeekGlanceCard.tsx src/components/dashboard/WeekGlanceCard.test.tsx && npx vitest run src/components/dashboard/WeekGlanceCard.test.tsx && npx eslint src`
Expected: 7 tests pass, ESLint clean, and `npx tsc -b` has no output.

- [ ] **Step 5: Suggested commit (user runs it)**

```bash
git add frontend/src/components/dashboard/WeekGlanceCard.tsx frontend/src/components/dashboard/WeekGlanceCard.test.tsx
git commit -m "feat(frontend): add the week at a glance card"
```

---

### Task 5: Assemble the Dashboard page

**Files:**
- Modify: `src/hooks/useSummary.ts` (return `now`), `src/pages/DashboardPage.tsx` (whole file), `src/pages/accessibility.test.tsx`
- Create: `src/pages/DashboardPage.test.tsx`

**Interfaces:**
- Consumes: `useSummary()` (now also returns `now: string`, the `YYYY-MM-DDTHH:mm` it requested with), `greeting`, `useAuthStore` (`user.name`), `PageHeader`, `WeekGlanceCard`, `ModuleCard`, `AppShell`, `ROUTES`.
- Produces: the redesigned `DashboardPage`: `AppShell` > `PageHeader` (the greeting is the `h1`) > `WeekGlanceCard` > an `h2` "Modules" > a grid of four `ModuleCard`s (Work Schedule links to `ROUTES.shifts` with icon `calendar`; Fitness `activity`, Nutrition `leaf`, Finance `wallet` have no link).

- [ ] **Step 1: Write the failing test `src/pages/DashboardPage.test.tsx`**

```tsx
import { render, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getSummary } from "../lib/summary-api";
import type { Summary } from "../lib/summary-api";
import { useAuthStore } from "../store/auth-store";
import { DashboardPage } from "./DashboardPage";

vi.mock("../lib/summary-api", () => ({ getSummary: vi.fn() }));
vi.mock("../lib/dates", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/dates")>()),
  localNow: () => "2026-10-07T19:30",
}));

const user = {
  id: "user-1",
  name: "Md Moinuddin",
  email: "md@example.com",
  createdAt: "2026-10-01T09:00:00.000Z",
};

const summary: Summary = {
  from: "2026-10-05",
  to: "2026-10-11",
  jobs: [
    {
      jobId: "job-1",
      name: "Warehouse",
      type: "part_time",
      hourlyRate: "12.00",
      earnedMinutes: 480,
      plannedMinutes: 1230,
      earnedAmount: "96.00",
      plannedAmount: "252.75",
    },
  ],
  totals: {
    earnedMinutes: 480,
    plannedMinutes: 1230,
    earnedAmount: "96.00",
    plannedAmount: "252.75",
  },
};

function renderPage() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getSummary).mockResolvedValue(summary);
  useAuthStore.setState({ user, accessToken: "token" });
});

afterEach(() => {
  useAuthStore.getState().clearAuth();
});

describe("DashboardPage", () => {
  it("greets the user by first name for the time of day", () => {
    renderPage();

    expect(
      screen.getByRole("heading", { level: 1, name: "Good evening, Md" }),
    ).toBeDefined();
  });

  it("asks for this week's summary with the browser's local time", async () => {
    renderPage();

    await screen.findByText("€252.75");
    expect(getSummary).toHaveBeenCalledWith({
      range: "week",
      date: "2026-10-07",
      now: "2026-10-07T19:30",
    });
  });

  it("shows the week at a glance once it loads", async () => {
    renderPage();

    expect(await screen.findByText("€252.75")).toBeDefined();
    expect(screen.getByText("planned this week · 20h 30m")).toBeDefined();
  });

  it("still shows the greeting and every module when the week cannot be loaded", async () => {
    vi.mocked(getSummary).mockRejectedValue(new Error("network down"));
    renderPage();

    expect(await screen.findByRole("alert")).toBeDefined();
    expect(
      screen.getByRole("heading", { level: 1, name: "Good evening, Md" }),
    ).toBeDefined();
    for (const title of ["Work Schedule", "Fitness", "Nutrition", "Finance"]) {
      expect(
        screen.getByRole("heading", { level: 3, name: title }),
      ).toBeDefined();
    }
  });

  it("makes Work Schedule the only module link", () => {
    renderPage();

    const main = within(screen.getByRole("main"));
    expect(
      main.getByRole("link", { name: "Work Schedule" }).getAttribute("href"),
    ).toBe("/shifts");
    for (const title of ["Fitness", "Nutrition", "Finance"]) {
      expect(main.queryByRole("link", { name: title })).toBeNull();
    }
    expect(main.getAllByText("Coming later")).toHaveLength(3);
  });

  it("has a Modules section heading under the week card", () => {
    renderPage();

    expect(
      screen.getByRole("heading", { level: 2, name: "Modules" }),
    ).toBeDefined();
  });

  it("has no accessibility violations once the week has loaded", async () => {
    const { container } = renderPage();
    await screen.findByText("€252.75");

    expect((await axe(container)).violations).toHaveLength(0);
  });

  it("has no accessibility violations in the error state", async () => {
    vi.mocked(getSummary).mockRejectedValue(new Error("network down"));
    const { container } = renderPage();
    await screen.findByRole("alert");

    expect((await axe(container)).violations).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Make the hook return `now`**

In `src/hooks/useSummary.ts`, add `now,` as the first entry of the returned object (before `state,`). Change nothing else.

- [ ] **Step 3: Run the page test and see it fail**

Run: `npx vitest run src/pages/DashboardPage.test.tsx`
Expected: FAIL (old page: no greeting, no week card, emoji icons).

- [ ] **Step 4: Replace `src/pages/DashboardPage.tsx`**

```tsx
import { ModuleCard } from "../components/dashboard/ModuleCard";
import { WeekGlanceCard } from "../components/dashboard/WeekGlanceCard";
import { AppShell } from "../components/layout/AppShell";
import type { IconName } from "../components/ui/Icon";
import { PageHeader } from "../components/ui/PageHeader";
import { useSummary } from "../hooks/useSummary";
import { greeting } from "../lib/greeting";
import { ROUTES } from "../lib/routes";
import { useAuthStore } from "../store/auth-store";

const MODULES: { icon: IconName; title: string; to?: string }[] = [
  { icon: "calendar", title: "Work Schedule", to: ROUTES.shifts },
  { icon: "activity", title: "Fitness" },
  { icon: "leaf", title: "Nutrition" },
  { icon: "wallet", title: "Finance" },
];

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const { state, now } = useSummary();

  return (
    <AppShell>
      <PageHeader title={greeting(now, user?.name)} />
      <WeekGlanceCard state={state} />
      <h2 className="mt-8 mb-4 text-section font-semibold text-ink">
        Modules
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MODULES.map((module) => (
          <ModuleCard
            key={module.title}
            icon={module.icon}
            title={module.title}
            to={module.to}
          />
        ))}
      </div>
    </AppShell>
  );
}
```

- [ ] **Step 5: Mock the summary request in the existing accessibility test**

In `src/pages/accessibility.test.tsx`: change the vitest import to `import { describe, expect, it, vi } from "vitest";`, and add (after the imports, before `describe`):
```tsx
vi.mock("../lib/summary-api", () => ({
  getSummary: vi.fn().mockResolvedValue({
    from: "2026-10-05",
    to: "2026-10-11",
    jobs: [],
    totals: {
      earnedMinutes: 0,
      plannedMinutes: 0,
      earnedAmount: "0.00",
      plannedAmount: "0.00",
    },
  }),
}));
```
Change nothing else in that file. (Without this mock the Dashboard would try a real network request during the test.)

- [ ] **Step 6: Run everything, typecheck, lint, format**

Run: `npx prettier --write src/pages/DashboardPage.tsx src/pages/DashboardPage.test.tsx src/pages/accessibility.test.tsx src/hooks/useSummary.ts && npx vitest run src/pages src/components/dashboard src/components/ui && npx tsc -b && npx eslint src`
Expected: all pass (DashboardPage 8 tests), `tsc -b` now clean, no other output. If axe reports a violation, fix the component it points to (never weaken the test) and say what you changed.

- [ ] **Step 7: Suggested commit (user runs it)**

```bash
git add frontend/src/hooks/useSummary.ts frontend/src/pages/DashboardPage.tsx frontend/src/pages/DashboardPage.test.tsx frontend/src/pages/accessibility.test.tsx
git commit -m "feat(frontend): redesign the dashboard with a greeting and the week at a glance"
```

---

### Task 6: Final checks and the browser pass

**Files:** none created. This task only verifies and reports.

- [ ] **Step 1: Look for leftovers**

Run:
```bash
grep -rnP "[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]" src/components/dashboard src/pages/DashboardPage.tsx
grep -rn "slate-\|indigo-\|red-[0-9]" src/components/dashboard src/pages/DashboardPage.tsx
grep -rn "text-sm" src/components/ui/links.ts
```
Expected: all three print nothing (no emoji, no old palette classes, no forced size in the link style). If the first grep is unsupported on this platform, run `grep -rn "🗓\|💪\|🥗\|💰" src` instead; it must print nothing.

- [ ] **Step 2: Run the full CI set**

Run:
```bash
npx prettier --check src/components src/pages src/lib src/hooks
npx tsc -b && echo TSC_OK
npm run build 2>&1 | grep -E "built|error"
rm -rf dist
npx eslint src && echo LINT_OK
npx vitest run 2>&1 | grep -E "Test Files|Tests|FAIL"
git status --short
```
Expected: `TSC_OK`, `built in ...`, `LINT_OK`, all tests pass, and `git status` lists only the files named in this plan.

- [ ] **Step 3: Browser pass (the user does this)**

With the app running and a user who has a few shifts this week:
1. The greeting matches the time of day and uses your first name ("Good morning, Md" and so on). It is the page title.
2. "Week at a glance" shows this week's date range, the planned amount, the planned hours, a progress bar for hours worked so far, "earned so far", and a "View summary" link that opens the Summary page.
3. With no shifts this week the card says "No shifts this week yet." with an "Add a shift" link to the Shifts page.
4. Stop the backend (or go offline) and reload: the card shows a short red message, while the greeting and the four module cards still appear.
5. Four module cards with line icons: Work Schedule is highlighted and clickable (opens Shifts); Fitness, Nutrition and Finance are dimmed with a "Coming later" badge and cannot be clicked.
6. At a phone width the cards stack in one column; at a tablet width two columns; on desktop four.
7. Keyboard only: Tab reaches the account menu, "View summary" and the Work Schedule card in order, each with a visible focus ring.

- [ ] **Step 4: Suggested commit (user runs it)**

Nothing new unless Step 1 or 2 led to a fix. Then push the branch and open the PR into `staging`.
