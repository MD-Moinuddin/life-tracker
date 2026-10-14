# UI Foundation and Core Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Project rule: never run `git commit`, `git push` or open a PR.** Every "Suggested commit" step is for the user to run. When a task is done, stop with a clean, verified working tree and report.

**Goal:** Build the Clean light design foundation (tokens, font, base styles, icons) and the shared UI components, without changing how any page looks or behaves yet.

**Architecture:** Design values live as semantic Tailwind v4 `@theme` tokens in one CSS file. Shared components in `frontend/src/components/ui/` use only those tokens. Existing pages keep working untouched, except that `FormField` is renamed to `Field` and moved into `ui/` (same API) so there is one field component, not two.

**Tech Stack:** React 19, TypeScript (strict), Tailwind CSS v4, Vitest + Testing Library + jest-axe, `@fontsource-variable/inter`.

**Spec:** `docs/superpowers/specs/2026-10-09-ui-redesign-design.md` (sections 1, 2 and delivery steps 1 and 2). Pages are redesigned in later plans, once these components exist.

## Global Constraints

- Work in `frontend/`. Branch for this plan: `feature/ui-foundation` from `staging`. Only the user creates branches, commits and pushes.
- No raw colours in new code: use token utilities (`bg-surface`, `text-ink`, ...), never `bg-white`, `text-slate-*` or hex values in components.
- Only one new dependency: `@fontsource-variable/inter`. No icon library, no component library.
- Every text and background pair used by the UI must be at least 4.5:1 (WCAG AA); a test enforces it.
- Decorative icons are `aria-hidden`; icons that carry meaning have a text label.
- Interactive controls are at least 44 px tall (`min-h-11`); compact buttons use `min-h-9 pointer-coarse:min-h-11`.
- Transitions are disabled under `prefers-reduced-motion`.
- Verification commands, all run in `frontend/`: `npx tsc -b`, `npm run build`, `npx eslint src`, `npx vitest run`. (`tsc --noEmit -p .` does not check anything here; always use `tsc -b`.)
- Code style: match the surrounding code (double quotes, 2-space indent, Prettier). Run `npx prettier --write <files>` before finishing a task.

## File Structure

Create:
- `src/styles/tokens.css`: all `@theme` design tokens.
- `src/lib/contrast.ts`, `src/lib/contrast.test.ts`: WCAG contrast maths.
- `src/styles/tokens.test.ts`: contrast of every token pair the UI uses.
- `src/lib/class-names.ts`, `src/lib/class-names.test.ts`: tiny class joiner.
- `src/components/ui/Icon.tsx` (+ test), `Button.tsx` (+ test), `Card.tsx` (+ test), `Badge.tsx` (+ test), `Alert.tsx` (+ test), `controls.ts`, `Input.tsx`, `Select.tsx` (+ one test file), `PasswordInput.tsx` (+ test), `PageHeader.tsx` (+ test), `EmptyState.tsx` (+ test), `Table.tsx` (+ test), `ui.accessibility.test.tsx`.

Move/rename:
- `src/components/form/FormField.tsx` → `src/components/ui/Field.tsx` (export `Field`), and its test.

Modify:
- `src/index.css` (imports, base layer).
- `package.json`, `package-lock.json` (new font dependency).

---

### Task 1: Font, design tokens and base styles

**Files:**
- Modify: `package.json`, `package-lock.json` (via npm)
- Create: `src/styles/tokens.css`
- Modify: `src/index.css`

**Interfaces:**
- Produces: Tailwind utilities generated from the tokens, which every later task uses: colours `page, surface, ink, ink-muted, border, border-strong, accent, accent-hover, accent-soft, accent-ink, on-accent, success, success-soft, success-ink, warning-soft, warning-border, warning-ink, danger, danger-hover, danger-soft, danger-border, danger-ink, neutral-soft`; radii `rounded-control`, `rounded-card`; shadow `shadow-card`; font sizes `text-title`, `text-section`; font `font-sans`.

- [ ] **Step 1: Install the font**

Run: `npm install @fontsource-variable/inter`
Expected: the package is added to `dependencies` in `package.json`.

- [ ] **Step 2: Create `src/styles/tokens.css`**

```css
/*
 * Design tokens for the Clean light theme. This is the only place colours,
 * radii, shadows and type sizes are defined. Components use the generated
 * utilities (bg-surface, text-ink, rounded-card, ...), never raw values.
 * Dark mode will redefine these same names under a dark selector.
 */
@theme {
  --font-sans:
    "Inter Variable", ui-sans-serif, system-ui, -apple-system, "Segoe UI",
    sans-serif;

  --color-page: #f6f7fb;
  --color-surface: #ffffff;
  --color-ink: #1b1f3b;
  --color-ink-muted: #5b6088;
  --color-border: #e6e8f0;
  --color-border-strong: #d5d8ea;

  --color-accent: #4f46e5;
  --color-accent-hover: #4338ca;
  --color-accent-soft: #e0e7ff;
  --color-accent-ink: #3730a3;
  --color-on-accent: #ffffff;

  --color-success: #047857;
  --color-success-soft: #d1fae5;
  --color-success-ink: #065f46;

  --color-warning-soft: #fffbeb;
  --color-warning-border: #f59e0b;
  --color-warning-ink: #78350f;

  --color-danger: #b91c1c;
  --color-danger-hover: #991b1b;
  --color-danger-soft: #fef2f2;
  --color-danger-border: #fecaca;
  --color-danger-ink: #991b1b;

  --color-neutral-soft: #eef0f7;

  --radius-control: 0.625rem;
  --radius-card: 1rem;

  --shadow-card: 0 1px 3px rgb(30 40 90 / 0.07);

  --text-title: 1.75rem;
  --text-title--line-height: 2.25rem;
  --text-section: 1.125rem;
  --text-section--line-height: 1.75rem;
}
```

- [ ] **Step 3: Replace `src/index.css`**

```css
@import "tailwindcss";
@import "@fontsource-variable/inter";
@import "./styles/tokens.css";

@layer base {
  body {
    background-color: var(--color-page);
    color: var(--color-ink);
    font-family: var(--font-sans);
  }

  /* One focus ring for every interactive element. */
  :focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    ::before,
    ::after {
      transition-duration: 0.01ms !important;
      animation-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
}
```

- [ ] **Step 4: Verify the build loads the tokens and the font**

Run: `npm run build && grep -c -e "--color-page" -e "Inter Variable" dist/assets/*.css`
Expected: the build succeeds and the count is 1 or more (Tailwind only writes the tokens that are used, and the base styles use `--color-page` and the font). If the build cannot resolve the font import, change the line in `src/index.css` to `@import "@fontsource-variable/inter/index.css";` and rerun. Then delete the build output: `rm -rf dist`.

- [ ] **Step 5: Run the full suite**

Run: `npx tsc -b && npx eslint src && npx vitest run`
Expected: all pass (no code changed, only styles).

- [ ] **Step 6: Suggested commit (user runs it)**

```bash
git add package.json package-lock.json src/styles/tokens.css src/index.css
git commit -m "feat(frontend): add the Clean light design tokens, Inter font and base styles"
```

---

### Task 2: Contrast helper and token contrast test

**Files:**
- Create: `src/lib/contrast.ts`, `src/lib/contrast.test.ts`, `src/styles/tokens.test.ts`

**Interfaces:**
- Produces: `contrastRatio(foreground: string, background: string): number` taking `#rrggbb` strings.
- Consumes: `tokens.css` colour names from Task 1.

- [ ] **Step 1: Write the failing helper test `src/lib/contrast.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { contrastRatio } from "./contrast";

describe("contrastRatio", () => {
  it("is 21 for black on white", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
  });

  it("is 1 for identical colours", () => {
    expect(contrastRatio("#4f46e5", "#4f46e5")).toBeCloseTo(1, 5);
  });

  it("does not depend on the order of the colours", () => {
    expect(contrastRatio("#1b1f3b", "#ffffff")).toBe(
      contrastRatio("#ffffff", "#1b1f3b"),
    );
  });

  it("matches a known value (white on indigo-600 is about 6.3)", () => {
    expect(contrastRatio("#ffffff", "#4f46e5")).toBeCloseTo(6.29, 1);
  });
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `npx vitest run src/lib/contrast.test.ts`
Expected: FAIL, cannot find `./contrast`.

- [ ] **Step 3: Implement `src/lib/contrast.ts`**

```ts
// WCAG 2.x relative luminance and contrast ratio for #rrggbb colours.

function channel(hex: string, start: number): number {
  const value = parseInt(hex.slice(start, start + 2), 16) / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const color = hex.replace("#", "");
  return (
    0.2126 * channel(color, 0) +
    0.7152 * channel(color, 2) +
    0.0722 * channel(color, 4)
  );
}

export function contrastRatio(foreground: string, background: string): number {
  const first = luminance(foreground);
  const second = luminance(background);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}
```

- [ ] **Step 4: Run it and see it pass**

Run: `npx vitest run src/lib/contrast.test.ts`
Expected: 4 passed.

- [ ] **Step 5: Write `src/styles/tokens.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import tokensCss from "./tokens.css?raw";
import { contrastRatio } from "../lib/contrast";

function color(name: string): string {
  const match = new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`).exec(
    tokensCss,
  );
  if (!match?.[1]) {
    throw new Error(`Token --color-${name} not found in tokens.css`);
  }
  return match[1];
}

// [text colour, background colour] for every pair the UI renders.
const TEXT_PAIRS: [string, string][] = [
  ["ink", "page"],
  ["ink", "surface"],
  ["ink", "neutral-soft"],
  ["ink-muted", "page"],
  ["ink-muted", "surface"],
  ["ink-muted", "neutral-soft"],
  ["on-accent", "accent"],
  ["on-accent", "accent-hover"],
  ["on-accent", "danger"],
  ["on-accent", "danger-hover"],
  ["accent", "surface"],
  ["accent", "page"],
  ["accent", "accent-soft"],
  ["accent-ink", "accent-soft"],
  ["success", "surface"],
  ["success-ink", "success-soft"],
  ["warning-ink", "warning-soft"],
  ["danger", "surface"],
  ["danger-ink", "danger-soft"],
];

describe("design tokens", () => {
  it.each(TEXT_PAIRS)("%s text on %s meets WCAG AA (4.5:1)", (text, bg) => {
    expect(contrastRatio(color(text), color(bg))).toBeGreaterThanOrEqual(4.5);
  });

  it("finds every token it is asked about", () => {
    expect(() => color("does-not-exist")).toThrow(/not found/);
  });
});
```

- [ ] **Step 6: Run it**

Run: `npx vitest run src/styles/tokens.test.ts`
Expected: 20 passed. If the `?raw` import fails to load, check that `tsc -b` sees `vite/client` types (it does via `tsconfig.app.json`); do not change the pairs to make a failing ratio pass, fix the token value in `tokens.css` instead.

- [ ] **Step 7: Typecheck and lint**

Run: `npx tsc -b && npx eslint src`
Expected: no output.

- [ ] **Step 8: Suggested commit (user runs it)**

```bash
git add src/lib/contrast.ts src/lib/contrast.test.ts src/styles/tokens.test.ts
git commit -m "test(frontend): check the contrast of every design token pair"
```

---

### Task 3: Class joiner

**Files:**
- Create: `src/lib/class-names.ts`, `src/lib/class-names.test.ts`

**Interfaces:**
- Produces: `classNames(...parts: (string | false | null | undefined)[]): string`, used by every `ui/` component.

- [ ] **Step 1: Write `src/lib/class-names.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { classNames } from "./class-names";

describe("classNames", () => {
  it("joins the parts with a space", () => {
    expect(classNames("a", "b")).toBe("a b");
  });

  it("skips false, null, undefined and empty strings", () => {
    expect(classNames("a", false, null, undefined, "", "b")).toBe("a b");
  });

  it("returns an empty string when nothing is left", () => {
    expect(classNames(false, undefined)).toBe("");
  });
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `npx vitest run src/lib/class-names.test.ts`
Expected: FAIL, cannot find `./class-names`.

- [ ] **Step 3: Implement `src/lib/class-names.ts`**

```ts
export function classNames(
  ...parts: (string | false | null | undefined)[]
): string {
  return parts.filter(Boolean).join(" ");
}
```

- [ ] **Step 4: Run it and see it pass**

Run: `npx vitest run src/lib/class-names.test.ts`
Expected: 3 passed.

- [ ] **Step 5: Suggested commit (user runs it)**

```bash
git add src/lib/class-names.ts src/lib/class-names.test.ts
git commit -m "feat(frontend): add a class name joiner"
```

---

### Task 4: Icon component

**Files:**
- Create: `src/components/ui/Icon.tsx`, `src/components/ui/Icon.test.tsx`

**Interfaces:**
- Produces: `type IconName = "plus" | "eye" | "eye-off" | "warning" | "error" | "info" | "chevron-left" | "chevron-right" | "calendar" | "activity" | "leaf" | "wallet"` and `Icon({ name, label?, className? })`. Without `label` the icon is `aria-hidden`; with `label` it is `role="img"` with that `aria-label`. Default size class is `h-5 w-5`.

- [ ] **Step 1: Write `src/components/ui/Icon.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Icon } from "./Icon";

describe("Icon", () => {
  it("is hidden from screen readers by default", () => {
    const { container } = render(<Icon name="plus" />);

    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    expect(svg?.getAttribute("role")).toBeNull();
  });

  it("is exposed as an image with a label when it carries meaning", () => {
    render(<Icon name="warning" label="Warning" />);

    const icon = screen.getByRole("img", { name: "Warning" });
    expect(icon.getAttribute("aria-hidden")).toBeNull();
  });

  it("takes a size class and defaults to 20px", () => {
    const { container, rerender } = render(<Icon name="plus" />);
    expect(container.querySelector("svg")?.getAttribute("class")).toContain(
      "h-5 w-5",
    );

    rerender(<Icon name="plus" className="h-4 w-4" />);
    expect(container.querySelector("svg")?.getAttribute("class")).toContain(
      "h-4 w-4",
    );
  });

  it("draws something for every icon name", () => {
    const names = [
      "plus",
      "eye",
      "eye-off",
      "warning",
      "error",
      "info",
      "chevron-left",
      "chevron-right",
      "calendar",
      "activity",
      "leaf",
      "wallet",
    ] as const;

    for (const name of names) {
      const { container, unmount } = render(<Icon name={name} />);
      expect(container.querySelector("svg")?.childElementCount).toBeGreaterThan(
        0,
      );
      unmount();
    }
  });
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `npx vitest run src/components/ui/Icon.test.tsx`
Expected: FAIL, cannot find `./Icon`.

- [ ] **Step 3: Implement `src/components/ui/Icon.tsx`**

```tsx
import type { ReactNode } from "react";

// Stroke icons on a 24x24 grid. Shapes adapted from Lucide (ISC license).
const ICONS = {
  plus: <path d="M12 5v14M5 12h14" />,
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  "eye-off": (
    <>
      <path d="m3 3 18 18" />
      <path d="M10.6 6.1A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7c1.7 0 3.2-.4 4.5-1" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </>
  ),
  warning: (
    <>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </>
  ),
  error: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </>
  ),
  "chevron-left": <path d="m15 18-6-6 6-6" />,
  "chevron-right": <path d="m9 18 6-6-6-6" />,
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ),
  activity: <path d="M22 12h-4l-3 9L9 3l-3 9H2" />,
  leaf: (
    <>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </>
  ),
  wallet: (
    <>
      <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
      <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof ICONS;

interface IconProps {
  name: IconName;
  // Set only when the icon carries meaning that the surrounding text does not.
  label?: string;
  className?: string;
}

export function Icon({ name, label, className = "h-5 w-5" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...(label
        ? { role: "img", "aria-label": label }
        : { "aria-hidden": true })}
    >
      {ICONS[name]}
    </svg>
  );
}
```

- [ ] **Step 4: Run it, typecheck, lint**

Run: `npx vitest run src/components/ui/Icon.test.tsx && npx tsc -b && npx eslint src`
Expected: 4 tests pass, no other output.

- [ ] **Step 5: Suggested commit (user runs it)**

```bash
git add src/components/ui/Icon.tsx src/components/ui/Icon.test.tsx
git commit -m "feat(frontend): add the Icon component with the shared icon set"
```

---

### Task 5: Button

**Files:**
- Create: `src/components/ui/Button.tsx`, `src/components/ui/Button.test.tsx`

**Interfaces:**
- Consumes: `classNames` (Task 3), `Spinner` from `src/components/Spinner.tsx` (no props).
- Produces: `Button` with props of a native `<button>` plus `variant?: "primary" | "secondary" | "danger"` (default `primary`), `size?: "normal" | "compact"` (default `normal`), `loading?: boolean`. `type` defaults to `"button"`. While `loading` the button is disabled, has `aria-busy="true"` and shows the spinner before its children.

- [ ] **Step 1: Write `src/components/ui/Button.test.tsx`**

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  it("is a plain button, not a submit button, by default", () => {
    render(<Button>Save</Button>);

    expect(screen.getByRole("button", { name: "Save" }).getAttribute("type")).toBe(
      "button",
    );
  });

  it("can be a submit button", () => {
    render(<Button type="submit">Save</Button>);

    expect(screen.getByRole("button", { name: "Save" }).getAttribute("type")).toBe(
      "submit",
    );
  });

  it("calls onClick", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("looks different for each variant", () => {
    const { rerender } = render(<Button variant="primary">Go</Button>);
    expect(screen.getByRole("button").className).toContain("bg-accent");

    rerender(<Button variant="secondary">Go</Button>);
    expect(screen.getByRole("button").className).toContain("border-border-strong");

    rerender(<Button variant="danger">Go</Button>);
    expect(screen.getByRole("button").className).toContain("bg-danger");
  });

  it("has a smaller compact size that still reaches 44px on touch screens", () => {
    render(<Button size="compact">Edit</Button>);

    const { className } = screen.getByRole("button");
    expect(className).toContain("min-h-9");
    expect(className).toContain("pointer-coarse:min-h-11");
  });

  it("is disabled and busy while loading, and ignores clicks", () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Saving…
      </Button>,
    );

    const button = screen.getByRole("button", { name: /Saving/ });
    fireEvent.click(button);

    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(onClick).not.toHaveBeenCalled();
  });

  it("is not marked busy when it is not loading", () => {
    render(<Button>Save</Button>);

    expect(screen.getByRole("button").getAttribute("aria-busy")).toBeNull();
  });

  it("can be disabled", () => {
    render(<Button disabled>Save</Button>);

    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(true);
  });
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `npx vitest run src/components/ui/Button.test.tsx`
Expected: FAIL, cannot find `./Button`.

- [ ] **Step 3: Implement `src/components/ui/Button.tsx`**

```tsx
import type { ComponentProps } from "react";
import { classNames } from "../../lib/class-names";
import { Spinner } from "../Spinner";

export type ButtonVariant = "primary" | "secondary" | "danger";
export type ButtonSize = "normal" | "compact";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-control text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-accent text-on-accent shadow-card hover:bg-accent-hover",
  secondary:
    "border border-border-strong bg-surface text-ink hover:bg-page",
  danger: "bg-danger text-on-accent hover:bg-danger-hover",
};

const SIZES: Record<ButtonSize, string> = {
  normal: "min-h-11 px-4 py-2",
  compact: "min-h-9 px-3 py-1.5 pointer-coarse:min-h-11",
};

interface ButtonProps extends ComponentProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "normal",
  loading = false,
  type = "button",
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={classNames(BASE, VARIANTS[variant], SIZES[size], className)}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
```

- [ ] **Step 4: Run it, typecheck, lint, format**

Run: `npx prettier --write src/components/ui/Button.tsx src/components/ui/Button.test.tsx && npx vitest run src/components/ui/Button.test.tsx && npx tsc -b && npx eslint src`
Expected: 8 tests pass, no other output.

- [ ] **Step 5: Suggested commit (user runs it)**

```bash
git add src/components/ui/Button.tsx src/components/ui/Button.test.tsx
git commit -m "feat(frontend): add the shared Button component"
```

---

### Task 6: Card

**Files:**
- Create: `src/components/ui/Card.tsx`, `src/components/ui/Card.test.tsx`

**Interfaces:**
- Consumes: `classNames`.
- Produces: `cardClassName(variant?: "plain" | "interactive", extra?: string): string` (for `<Link>` or `<a>` cards) and `Card` (a `<div>` with props of a native div plus `variant?`).

- [ ] **Step 1: Write `src/components/ui/Card.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Link } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { Card, cardClassName } from "./Card";

describe("Card", () => {
  it("renders its children in a bordered surface", () => {
    render(<Card>Hello</Card>);

    const card = screen.getByText("Hello");
    expect(card.className).toContain("bg-surface");
    expect(card.className).toContain("border-border");
    expect(card.className).toContain("rounded-card");
  });

  it("has no hover style when plain", () => {
    render(<Card>Plain</Card>);

    expect(screen.getByText("Plain").className).not.toContain("hover:");
  });

  it("has a hover style when interactive", () => {
    render(<Card variant="interactive">Link</Card>);

    expect(screen.getByText("Link").className).toContain("hover:border-accent");
  });

  it("merges extra classes and passes other props through", () => {
    render(
      <Card className="p-4" data-testid="card">
        x
      </Card>,
    );

    const card = screen.getByTestId("card");
    expect(card.className).toContain("p-4");
    expect(card.className).toContain("bg-surface");
  });
});

describe("cardClassName", () => {
  it("styles a link as an interactive card", () => {
    render(
      <MemoryRouter>
        <Link to="/shifts" className={cardClassName("interactive", "p-4")}>
          Work Schedule
        </Link>
      </MemoryRouter>,
    );

    const link = screen.getByRole("link", { name: "Work Schedule" });
    expect(link.className).toContain("hover:border-accent");
    expect(link.className).toContain("p-4");
  });
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `npx vitest run src/components/ui/Card.test.tsx`
Expected: FAIL, cannot find `./Card`.

- [ ] **Step 3: Implement `src/components/ui/Card.tsx`**

```tsx
import type { ComponentProps } from "react";
import { classNames } from "../../lib/class-names";

export type CardVariant = "plain" | "interactive";

const BASE = "rounded-card border border-border bg-surface shadow-card";
const INTERACTIVE = "transition-colors hover:border-accent hover:bg-page";

// Also used directly by link cards: <Link className={cardClassName("interactive")}>.
export function cardClassName(
  variant: CardVariant = "plain",
  extra?: string,
): string {
  return classNames(BASE, variant === "interactive" && INTERACTIVE, extra);
}

interface CardProps extends ComponentProps<"div"> {
  variant?: CardVariant;
}

export function Card({ variant = "plain", className, ...props }: CardProps) {
  return <div className={cardClassName(variant, className)} {...props} />;
}
```

- [ ] **Step 4: Run it, typecheck, lint, format**

Run: `npx prettier --write src/components/ui/Card.tsx src/components/ui/Card.test.tsx && npx vitest run src/components/ui/Card.test.tsx && npx tsc -b && npx eslint src`
Expected: 5 tests pass, no other output.

- [ ] **Step 5: Suggested commit (user runs it)**

```bash
git add src/components/ui/Card.tsx src/components/ui/Card.test.tsx
git commit -m "feat(frontend): add the shared Card component"
```

---

### Task 7: Badge

**Files:**
- Create: `src/components/ui/Badge.tsx`, `src/components/ui/Badge.test.tsx`

**Interfaces:**
- Consumes: `classNames`.
- Produces: `Badge({ tone?: "accent" | "success" | "neutral", children })`; default tone `neutral`.

- [ ] **Step 1: Write `src/components/ui/Badge.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "./Badge";

describe("Badge", () => {
  it("shows its text", () => {
    render(<Badge>Mini-job</Badge>);

    expect(screen.getByText("Mini-job")).toBeDefined();
  });

  it("is neutral by default", () => {
    render(<Badge>Coming later</Badge>);

    expect(screen.getByText("Coming later").className).toContain("bg-neutral-soft");
  });

  it("has an accent and a success tone", () => {
    const { rerender } = render(<Badge tone="accent">A</Badge>);
    expect(screen.getByText("A").className).toContain("bg-accent-soft");

    rerender(<Badge tone="success">A</Badge>);
    expect(screen.getByText("A").className).toContain("bg-success-soft");
  });
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `npx vitest run src/components/ui/Badge.test.tsx`
Expected: FAIL, cannot find `./Badge`.

- [ ] **Step 3: Implement `src/components/ui/Badge.tsx`**

```tsx
import type { ReactNode } from "react";
import { classNames } from "../../lib/class-names";

export type BadgeTone = "accent" | "success" | "neutral";

const BASE =
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";

const TONES: Record<BadgeTone, string> = {
  accent: "bg-accent-soft text-accent-ink",
  success: "bg-success-soft text-success-ink",
  neutral: "bg-neutral-soft text-ink-muted",
};

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
}

export function Badge({ tone = "neutral", children }: BadgeProps) {
  return <span className={classNames(BASE, TONES[tone])}>{children}</span>;
}
```

- [ ] **Step 4: Run it, typecheck, lint, format**

Run: `npx prettier --write src/components/ui/Badge.tsx src/components/ui/Badge.test.tsx && npx vitest run src/components/ui/Badge.test.tsx && npx tsc -b && npx eslint src`
Expected: 3 tests pass, no other output.

- [ ] **Step 5: Suggested commit (user runs it)**

```bash
git add src/components/ui/Badge.tsx src/components/ui/Badge.test.tsx
git commit -m "feat(frontend): add the shared Badge component"
```

---

### Task 8: Alert

**Files:**
- Create: `src/components/ui/Alert.tsx`, `src/components/ui/Alert.test.tsx`

**Interfaces:**
- Consumes: `Icon` (Task 4), `classNames`.
- Produces: `Alert({ tone, title?, role?, children })` where `tone` is `"warning" | "danger" | "info"`. It always shows an icon plus text. `role` is passed through only if given (`"status"` or `"alert"`), so callers keep full control of live-region behaviour.

- [ ] **Step 1: Write `src/components/ui/Alert.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Alert } from "./Alert";

describe("Alert", () => {
  it("shows its message", () => {
    render(<Alert tone="info">You can keep logging shifts.</Alert>);

    expect(screen.getByText("You can keep logging shifts.")).toBeDefined();
  });

  it("shows a bold title before the message", () => {
    render(
      <Alert tone="warning" title="Mini-job warning.">
        Over the threshold.
      </Alert>,
    );

    expect(screen.getByText("Mini-job warning.").tagName).toBe("STRONG");
    expect(screen.getByText(/Over the threshold/)).toBeDefined();
  });

  it("has no live-region role unless one is given", () => {
    const { container } = render(<Alert tone="info">Hello</Alert>);

    expect(container.firstElementChild?.getAttribute("role")).toBeNull();
  });

  it("passes the role through", () => {
    render(
      <Alert tone="danger" role="alert">
        Could not save.
      </Alert>,
    );

    expect(screen.getByRole("alert").textContent).toContain("Could not save.");
  });

  it("is never colour alone: every tone has an icon that screen readers skip", () => {
    for (const tone of ["warning", "danger", "info"] as const) {
      const { container, unmount } = render(<Alert tone={tone}>x</Alert>);
      const icon = container.querySelector("svg");
      expect(icon).not.toBeNull();
      expect(icon?.getAttribute("aria-hidden")).toBe("true");
      unmount();
    }
  });

  it("uses the colours of its tone", () => {
    const { container, rerender } = render(<Alert tone="warning">x</Alert>);
    expect(container.firstElementChild?.className).toContain("bg-warning-soft");

    rerender(<Alert tone="danger">x</Alert>);
    expect(container.firstElementChild?.className).toContain("bg-danger-soft");

    rerender(<Alert tone="info">x</Alert>);
    expect(container.firstElementChild?.className).toContain("bg-accent-soft");
  });
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `npx vitest run src/components/ui/Alert.test.tsx`
Expected: FAIL, cannot find `./Alert`.

- [ ] **Step 3: Implement `src/components/ui/Alert.tsx`**

```tsx
import type { ReactNode } from "react";
import { classNames } from "../../lib/class-names";
import { Icon } from "./Icon";
import type { IconName } from "./Icon";

export type AlertTone = "warning" | "danger" | "info";

const BASE =
  "flex gap-3 rounded-control border p-3 text-sm";

const TONES: Record<AlertTone, { box: string; icon: IconName }> = {
  warning: {
    box: "border-warning-border bg-warning-soft text-warning-ink",
    icon: "warning",
  },
  danger: {
    box: "border-danger-border bg-danger-soft text-danger-ink",
    icon: "error",
  },
  info: {
    box: "border-accent-soft bg-accent-soft text-accent-ink",
    icon: "info",
  },
};

interface AlertProps {
  tone: AlertTone;
  title?: string;
  role?: "status" | "alert";
  children: ReactNode;
}

export function Alert({ tone, title, role, children }: AlertProps) {
  const { box, icon } = TONES[tone];

  return (
    <div role={role} className={classNames(BASE, box)}>
      <Icon name={icon} className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        {title && <strong className="font-semibold">{title}</strong>}
        {title && " "}
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run it, typecheck, lint, format**

Run: `npx prettier --write src/components/ui/Alert.tsx src/components/ui/Alert.test.tsx && npx vitest run src/components/ui/Alert.test.tsx && npx tsc -b && npx eslint src`
Expected: 6 tests pass, no other output.

- [ ] **Step 5: Suggested commit (user runs it)**

```bash
git add src/components/ui/Alert.tsx src/components/ui/Alert.test.tsx
git commit -m "feat(frontend): add the shared Alert component"
```

---

### Task 9: Field (moved from FormField), Input and Select

**Files:**
- Move: `src/components/form/FormField.tsx` → `src/components/ui/Field.tsx`; `src/components/form/FormField.test.tsx` → `src/components/ui/Field.test.tsx`
- Modify: every file that imports `FormField` (find with `grep -rl "FormField" src`)
- Create: `src/components/ui/controls.ts`, `src/components/ui/Input.tsx`, `src/components/ui/Select.tsx`, `src/components/ui/controls.test.tsx`

**Interfaces:**
- Produces: `Field` (identical API to the old `FormField`: `{ label, hint?, errors?, children: (control: { id; "aria-invalid"; "aria-describedby" }) => ReactNode }`), `Input` and `Select` (native props plus `className`), and `CONTROL_CLASSES` (shared look of text controls).
- Consumes: `classNames`.

- [ ] **Step 1: Move the field and its test with git, then rename the export**

```bash
mv src/components/form/FormField.tsx src/components/ui/Field.tsx
mv src/components/form/FormField.test.tsx src/components/ui/Field.test.tsx
```
(Use plain `mv`, not `git mv`, so nothing is staged; the user stages everything at commit time.)

- [ ] **Step 2: Replace the contents of `src/components/ui/Field.tsx`**

```tsx
import { useId, type ReactNode } from "react";

interface ControlProps {
  id: string;
  "aria-invalid": boolean;
  "aria-describedby": string | undefined;
}

interface FieldProps {
  label: string;
  hint?: string;
  errors?: string[];
  children: (controlProps: ControlProps) => ReactNode;
}

export function Field({ label, hint, errors = [], children }: FieldProps) {
  const controlId = useId();
  const hintId = useId();
  const errorId = useId();
  const hasErrors = errors.length > 0;
  const describedBy = [hint ? hintId : null, hasErrors ? errorId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      <label
        htmlFor={controlId}
        className="mb-1 block text-sm font-medium text-ink"
      >
        {label}
      </label>
      {children({
        id: controlId,
        "aria-invalid": hasErrors,
        "aria-describedby": describedBy || undefined,
      })}
      {hint && (
        <p id={hintId} className="mt-1 text-sm text-ink-muted">
          {hint}
        </p>
      )}
      {hasErrors && (
        <div id={errorId} role="alert" className="mt-1 text-sm text-danger">
          {errors.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Update `src/components/ui/Field.test.tsx`**

Change the import line to `import { Field } from "./Field";`, the describe to `describe("Field", ...)`, and in `renderField` replace `<FormField label="Name" {...props}>` / `</FormField>` with `<Field label="Name" {...props}>` / `</Field>`. Leave every assertion unchanged.

- [ ] **Step 4: Point every importer at the new component**

Run: `grep -rl "FormField" src`
For each file listed (the forms under `src/components/auth/` and `src/components/jobs/`, `src/components/shifts/`), change `FormField` to `Field` in the identifier and JSX, and change the import path to the `ui/Field` module, for example `import { FormField } from "../form/FormField";` becomes `import { Field } from "../ui/Field";`.
Then run: `grep -rn "FormField" src`
Expected: no matches.

- [ ] **Step 5: Write `src/components/ui/controls.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Input } from "./Input";
import { Select } from "./Select";

describe("Input", () => {
  it("is a text control with the shared look", () => {
    render(<Input aria-label="Name" />);

    const input = screen.getByLabelText("Name");
    expect(input.tagName).toBe("INPUT");
    expect(input.className).toContain("rounded-control");
    expect(input.className).toContain("border-border-strong");
    expect(input.className).toContain("min-h-11");
  });

  it("styles the invalid state from aria-invalid", () => {
    render(<Input aria-label="Name" aria-invalid />);

    expect(screen.getByLabelText("Name").className).toContain(
      "aria-invalid:border-danger",
    );
  });

  it("passes native props and merges extra classes", () => {
    render(
      <Input aria-label="Rate" type="number" placeholder="12.50" className="w-24" />,
    );

    const input = screen.getByLabelText("Rate");
    expect(input.getAttribute("type")).toBe("number");
    expect(input.getAttribute("placeholder")).toBe("12.50");
    expect(input.className).toContain("w-24");
  });
});

describe("Select", () => {
  it("is a select with the same shared look", () => {
    render(
      <Select aria-label="Job">
        <option value="a">Warehouse</option>
      </Select>,
    );

    const select = screen.getByLabelText("Job");
    expect(select.tagName).toBe("SELECT");
    expect(select.className).toContain("rounded-control");
    expect(screen.getByRole("option", { name: "Warehouse" })).toBeDefined();
  });
});
```

- [ ] **Step 6: Run it and see it fail**

Run: `npx vitest run src/components/ui/controls.test.tsx`
Expected: FAIL, cannot find `./Input`.

- [ ] **Step 7: Implement `controls.ts`, `Input.tsx`, `Select.tsx`**

`src/components/ui/controls.ts`:
```ts
// The shared look of text-like form controls. Input and Select both use it,
// so changing how controls look is a one-line edit here.
export const CONTROL_CLASSES =
  "min-h-11 w-full rounded-control border border-border-strong bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted aria-invalid:border-danger disabled:bg-page disabled:text-ink-muted";
```

`src/components/ui/Input.tsx`:
```tsx
import type { ComponentProps } from "react";
import { classNames } from "../../lib/class-names";
import { CONTROL_CLASSES } from "./controls";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={classNames(CONTROL_CLASSES, className)} {...props} />;
}
```

`src/components/ui/Select.tsx`:
```tsx
import type { ComponentProps } from "react";
import { classNames } from "../../lib/class-names";
import { CONTROL_CLASSES } from "./controls";

export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <select className={classNames(CONTROL_CLASSES, className)} {...props} />
  );
}
```

- [ ] **Step 8: Verify everything, including the pages that use `Field`**

Run: `npx prettier --write src/components && npx tsc -b && npx eslint src && npx vitest run`
Expected: all pass. The moved `Field` tests and every form and page test still pass, since only the name and label colour changed.

- [ ] **Step 9: Suggested commit (user runs it)**

```bash
git add src/components/ui src/components/form src/components/auth src/components/jobs src/components/shifts
git commit -m "feat(frontend): add Input and Select, and move FormField to ui/Field"
```
Run `git status` before committing and confirm only these files are staged.

---

### Task 10: PasswordInput

**Files:**
- Create: `src/components/ui/PasswordInput.tsx`, `src/components/ui/PasswordInput.test.tsx`

**Interfaces:**
- Consumes: `Input` (Task 9), `classNames`.
- Produces: `PasswordInput` taking native input props except `type`. It renders an `Input` of type `password` and a toggle button. The button's accessible name is `Show password` or `Hide password`; its visible text is `Show` or `Hide`.

- [ ] **Step 1: Write `src/components/ui/PasswordInput.test.tsx`**

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PasswordInput } from "./PasswordInput";

describe("PasswordInput", () => {
  it("hides the password by default", () => {
    render(<PasswordInput aria-label="Password" />);

    expect(screen.getByLabelText("Password").getAttribute("type")).toBe(
      "password",
    );
    expect(screen.getByRole("button", { name: "Show password" })).toBeDefined();
  });

  it("shows the password when the toggle is pressed, and hides it again", () => {
    render(<PasswordInput aria-label="Password" />);

    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(screen.getByLabelText("Password").getAttribute("type")).toBe("text");

    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(screen.getByLabelText("Password").getAttribute("type")).toBe(
      "password",
    );
  });

  it("shows Show or Hide as the visible text", () => {
    render(<PasswordInput aria-label="Password" />);

    const toggle = screen.getByRole("button", { name: "Show password" });
    expect(toggle.textContent).toBe("Show");

    fireEvent.click(toggle);
    expect(toggle.textContent).toBe("Hide");
  });

  it("does not submit a form when the toggle is pressed", () => {
    render(
      <form>
        <PasswordInput aria-label="Password" />
      </form>,
    );

    expect(
      screen.getByRole("button", { name: "Show password" }).getAttribute("type"),
    ).toBe("button");
  });

  it("keeps the value and passes native props to the input", () => {
    render(
      <PasswordInput
        aria-label="Password"
        defaultValue="secret"
        autoComplete="current-password"
      />,
    );

    const input = screen.getByLabelText("Password") as HTMLInputElement;
    expect(input.value).toBe("secret");
    expect(input.getAttribute("autocomplete")).toBe("current-password");

    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect((screen.getByLabelText("Password") as HTMLInputElement).value).toBe(
      "secret",
    );
  });
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `npx vitest run src/components/ui/PasswordInput.test.tsx`
Expected: FAIL, cannot find `./PasswordInput`.

- [ ] **Step 3: Implement `src/components/ui/PasswordInput.tsx`**

```tsx
import { useState, type ComponentProps } from "react";
import { classNames } from "../../lib/class-names";
import { Input } from "./Input";

type PasswordInputProps = Omit<ComponentProps<"input">, "type">;

export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        className={classNames("pr-16", className)}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 flex items-center rounded-control px-3 text-sm font-medium text-accent hover:text-accent-hover"
      >
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Run it, typecheck, lint, format**

Run: `npx prettier --write src/components/ui/PasswordInput.tsx src/components/ui/PasswordInput.test.tsx && npx vitest run src/components/ui/PasswordInput.test.tsx && npx tsc -b && npx eslint src`
Expected: 5 tests pass, no other output.

- [ ] **Step 5: Suggested commit (user runs it)**

```bash
git add src/components/ui/PasswordInput.tsx src/components/ui/PasswordInput.test.tsx
git commit -m "feat(frontend): add PasswordInput with a show and hide toggle"
```

---

### Task 11: PageHeader and EmptyState

**Files:**
- Create: `src/components/ui/PageHeader.tsx`, `src/components/ui/PageHeader.test.tsx`, `src/components/ui/EmptyState.tsx`, `src/components/ui/EmptyState.test.tsx`

**Interfaces:**
- Consumes: `Icon`, `IconName`.
- Produces: `PageHeader({ title, subtitle?, action? })` (renders the page's one `<h1>`), and `EmptyState({ icon?, title?, action?, children })` where `children` is the explanatory text.

- [ ] **Step 1: Write the two tests**

`src/components/ui/PageHeader.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageHeader } from "./PageHeader";

describe("PageHeader", () => {
  it("renders the title as the page heading", () => {
    render(<PageHeader title="Jobs" />);

    expect(screen.getByRole("heading", { level: 1, name: "Jobs" })).toBeDefined();
  });

  it("shows a subtitle when given", () => {
    render(<PageHeader title="Jobs" subtitle="Where you work" />);

    expect(screen.getByText("Where you work")).toBeDefined();
  });

  it("shows the action next to the title", () => {
    render(<PageHeader title="Jobs" action={<button type="button">Add job</button>} />);

    expect(screen.getByRole("button", { name: "Add job" })).toBeDefined();
  });

  it("omits the subtitle and action when not given", () => {
    const { container } = render(<PageHeader title="Jobs" />);

    expect(container.querySelectorAll("p")).toHaveLength(0);
    expect(container.querySelectorAll("button")).toHaveLength(0);
  });
});
```

`src/components/ui/EmptyState.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("shows its message", () => {
    render(<EmptyState>No shifts in this period.</EmptyState>);

    expect(screen.getByText("No shifts in this period.")).toBeDefined();
  });

  it("shows a title and an action when given", () => {
    render(
      <EmptyState title="No jobs yet" action={<button type="button">Add job</button>}>
        Add your first job to start tracking shifts.
      </EmptyState>,
    );

    expect(screen.getByText("No jobs yet")).toBeDefined();
    expect(screen.getByRole("button", { name: "Add job" })).toBeDefined();
  });

  it("shows a decorative icon when given", () => {
    const { container } = render(<EmptyState icon="calendar">Nothing here.</EmptyState>);

    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("has no icon by default", () => {
    const { container } = render(<EmptyState>Nothing here.</EmptyState>);

    expect(container.querySelector("svg")).toBeNull();
  });
});
```

- [ ] **Step 2: Run them and see them fail**

Run: `npx vitest run src/components/ui/PageHeader.test.tsx src/components/ui/EmptyState.test.tsx`
Expected: FAIL, cannot find the modules.

- [ ] **Step 3: Implement both components**

`src/components/ui/PageHeader.tsx`:
```tsx
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-title font-bold tracking-tight text-ink">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
```

`src/components/ui/EmptyState.tsx`:
```tsx
import type { ReactNode } from "react";
import { Icon } from "./Icon";
import type { IconName } from "./Icon";

interface EmptyStateProps {
  icon?: IconName;
  title?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function EmptyState({ icon, title, action, children }: EmptyStateProps) {
  return (
    <div className="rounded-card border border-dashed border-border-strong bg-surface p-8 text-center">
      {icon && (
        <div className="mb-3 flex justify-center text-ink-muted">
          <Icon name={icon} className="h-8 w-8" />
        </div>
      )}
      {title && (
        <p className="mb-1 text-section font-semibold text-ink">{title}</p>
      )}
      <p className="text-sm text-ink-muted">{children}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
```

- [ ] **Step 4: Run, typecheck, lint, format**

Run: `npx prettier --write src/components/ui && npx vitest run src/components/ui/PageHeader.test.tsx src/components/ui/EmptyState.test.tsx && npx tsc -b && npx eslint src`
Expected: 8 tests pass, no other output.

- [ ] **Step 5: Suggested commit (user runs it)**

```bash
git add src/components/ui/PageHeader.tsx src/components/ui/PageHeader.test.tsx src/components/ui/EmptyState.tsx src/components/ui/EmptyState.test.tsx
git commit -m "feat(frontend): add PageHeader and EmptyState"
```

---

### Task 12: Table pieces

**Files:**
- Create: `src/components/ui/Table.tsx`, `src/components/ui/Table.test.tsx`

**Interfaces:**
- Consumes: `classNames`.
- Produces: `Table({ caption, children })` (scrolls horizontally inside a card; `children` are `<thead>`, `<tbody>`, `<tfoot>`), `HeaderCell({ align?, children })` (a `<th scope="col">`), `RowHeader({ children })` (a `<th scope="row">`), `Cell({ align?, children })` (a `<td>`). `align` is `"left" | "right"`; default `left` for `HeaderCell`/`Cell`... numbers pass `align="right"`.

- [ ] **Step 1: Write `src/components/ui/Table.test.tsx`**

```tsx
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Cell, HeaderCell, RowHeader, Table } from "./Table";

function renderTable() {
  render(
    <Table caption="Hours and earnings per job">
      <thead>
        <tr>
          <HeaderCell>Job</HeaderCell>
          <HeaderCell align="right">Earned</HeaderCell>
        </tr>
      </thead>
      <tbody>
        <tr>
          <RowHeader>Warehouse</RowHeader>
          <Cell align="right">€96.00</Cell>
        </tr>
      </tbody>
    </Table>,
  );
}

describe("Table", () => {
  it("is a table named by its caption", () => {
    renderTable();

    expect(
      screen.getByRole("table", { name: "Hours and earnings per job" }),
    ).toBeDefined();
  });

  it("has column headers and a row header", () => {
    renderTable();

    expect(screen.getByRole("columnheader", { name: "Job" })).toBeDefined();
    expect(screen.getByRole("rowheader", { name: "Warehouse" })).toBeDefined();
  });

  it("puts the data in cells", () => {
    renderTable();

    const row = screen.getByRole("row", { name: /Warehouse/ });
    expect(within(row).getByRole("cell").textContent).toBe("€96.00");
  });

  it("right-aligns numeric columns and left-aligns the rest", () => {
    renderTable();

    expect(screen.getByRole("columnheader", { name: "Job" }).className).toContain(
      "text-left",
    );
    expect(
      screen.getByRole("columnheader", { name: "Earned" }).className,
    ).toContain("text-right");
    expect(screen.getByRole("cell").className).toContain("text-right");
  });

  it("scrolls sideways inside its card instead of widening the page", () => {
    const { container } = render(
      <Table caption="x">
        <tbody />
      </Table>,
    );

    expect(container.firstElementChild?.className).toContain("overflow-x-auto");
  });
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `npx vitest run src/components/ui/Table.test.tsx`
Expected: FAIL, cannot find `./Table`.

- [ ] **Step 3: Implement `src/components/ui/Table.tsx`**

```tsx
import type { ReactNode } from "react";
import { classNames } from "../../lib/class-names";

type Align = "left" | "right";

const ALIGN: Record<Align, string> = {
  left: "text-left",
  right: "text-right tabular-nums",
};

interface TableProps {
  caption: string;
  children: ReactNode;
}

export function Table({ caption, children }: TableProps) {
  return (
    <div className="overflow-x-auto rounded-card border border-border bg-surface shadow-card">
      <table className="w-full text-sm text-ink [&_tbody]:divide-y [&_tbody]:divide-border [&_tfoot]:border-t [&_tfoot]:border-border-strong [&_tfoot]:bg-page [&_tfoot]:font-semibold [&_thead]:bg-page">
        <caption className="px-3 py-2 text-left text-ink-muted">
          {caption}
        </caption>
        {children}
      </table>
    </div>
  );
}

interface CellProps {
  align?: Align;
  children: ReactNode;
}

export function HeaderCell({ align = "left", children }: CellProps) {
  return (
    <th
      scope="col"
      className={classNames("px-3 py-2 font-medium text-ink-muted", ALIGN[align])}
    >
      {children}
    </th>
  );
}

export function RowHeader({ children }: { children: ReactNode }) {
  return (
    <th scope="row" className="px-3 py-2 text-left font-medium">
      {children}
    </th>
  );
}

export function Cell({ align = "left", children }: CellProps) {
  return <td className={classNames("px-3 py-2", ALIGN[align])}>{children}</td>;
}
```

- [ ] **Step 4: Run it, typecheck, lint, format**

Run: `npx prettier --write src/components/ui/Table.tsx src/components/ui/Table.test.tsx && npx vitest run src/components/ui/Table.test.tsx && npx tsc -b && npx eslint src`
Expected: 5 tests pass, no other output.

- [ ] **Step 5: Suggested commit (user runs it)**

```bash
git add src/components/ui/Table.tsx src/components/ui/Table.test.tsx
git commit -m "feat(frontend): add the shared Table pieces"
```

---

### Task 13: Accessibility check of the whole set, and final verification

**Files:**
- Create: `src/components/ui/ui.accessibility.test.tsx`

**Interfaces:**
- Consumes: every component from Tasks 4 to 12.

- [ ] **Step 1: Write `src/components/ui/ui.accessibility.test.tsx`**

```tsx
import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { MemoryRouter, Link } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { Alert } from "./Alert";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { Card, cardClassName } from "./Card";
import { EmptyState } from "./EmptyState";
import { Field } from "./Field";
import { Input } from "./Input";
import { PageHeader } from "./PageHeader";
import { PasswordInput } from "./PasswordInput";
import { Select } from "./Select";
import { Cell, HeaderCell, RowHeader, Table } from "./Table";

describe("shared UI components", () => {
  it("have no accessibility violations when used together", async () => {
    const { container } = render(
      <MemoryRouter>
        <main>
          <PageHeader
            title="Summary"
            subtitle="Your hours and earnings"
            action={<Button>Add shift</Button>}
          />
          <Alert tone="warning" title="Mini-job warning." role="status">
            Planned mini-job earnings are over the threshold.
          </Alert>
          <Alert tone="danger" role="alert">
            Could not save.
          </Alert>
          <Alert tone="info">You can keep logging shifts.</Alert>
          <form>
            <Field label="Name" hint="As on your contract" errors={["Required"]}>
              {(control) => <Input {...control} />}
            </Field>
            <Field label="Job">
              {(control) => (
                <Select {...control}>
                  <option value="a">Warehouse</option>
                </Select>
              )}
            </Field>
            <Field label="Password">
              {(control) => <PasswordInput {...control} />}
            </Field>
            <Button type="submit" variant="secondary">
              Save
            </Button>
            <Button variant="danger" size="compact" loading>
              Deleting…
            </Button>
          </form>
          <Card>
            <Badge tone="accent">Mini-job</Badge>
            <Badge tone="success">Part-time</Badge>
            <Badge>Coming later</Badge>
          </Card>
          <Link to="/shifts" className={cardClassName("interactive", "block p-4")}>
            Work Schedule
          </Link>
          <EmptyState icon="calendar" title="No shifts" action={<Button>Add shift</Button>}>
            Add a shift to see it here.
          </EmptyState>
          <Table caption="Hours and earnings per job">
            <thead>
              <tr>
                <HeaderCell>Job</HeaderCell>
                <HeaderCell align="right">Earned</HeaderCell>
              </tr>
            </thead>
            <tbody>
              <tr>
                <RowHeader>Warehouse</RowHeader>
                <Cell align="right">€96.00</Cell>
              </tr>
            </tbody>
          </Table>
        </main>
      </MemoryRouter>,
    );

    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run it**

Run: `npx vitest run src/components/ui/ui.accessibility.test.tsx`
Expected: 1 passed. If axe reports a violation, fix the component it points to (never weaken the test), then rerun.

- [ ] **Step 3: Format, then run the full CI set**

Run:
```bash
npx prettier --write src/components/ui
npx tsc -b && echo TSC_OK
npm run build 2>&1 | grep -E "built|error"
npx eslint src && echo LINT_OK
npx vitest run 2>&1 | grep -E "Test Files|Tests|FAIL"
rm -rf dist
git status --short
```
Expected: `TSC_OK`, `built in ...`, `LINT_OK`, all test files and tests pass, and `git status` shows only the files from this plan.

- [ ] **Step 4: Confirm nothing visible changed**

Run: `grep -rln "components/ui/" src --include=*.tsx | grep -v "components/ui/"`
Expected: only the files that import `Field` (the forms from Task 9). No page uses `Button`, `Card`, `Badge`, `Alert`, `Input`, `Select`, `PasswordInput`, `PageHeader`, `EmptyState`, `Table` or `Icon` yet. Those migrations happen page by page in later plans.

- [ ] **Step 5: Suggested commit (user runs it)**

```bash
git add src/components/ui/ui.accessibility.test.tsx
git commit -m "test(frontend): check the shared UI components for accessibility violations together"
```

Then push the branch and open the PR into `staging`.
