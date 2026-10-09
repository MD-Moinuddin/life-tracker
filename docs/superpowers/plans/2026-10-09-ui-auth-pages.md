# UI Login and Signup Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Project rule: never run `git commit`, `git add`, `git push` or open a PR.** Every "Suggested commit" step is for the user to run. When a task is done, stop with a clean, verified working tree and report. Do not create or switch branches.

**Goal:** Give the Login and Signup pages the Clean light look: a centred card on the page background with the brand and a short tagline, a friendly heading ("Welcome back" / "Create your account"), shared form fields, a Show/Hide password toggle, and errors shown in the shared `Alert`.

**Architecture:** There are no tests for these pages or forms today, so Task 1 pins the existing behaviour with tests that must pass on the current code. After that, the visual layer (`AuthLayout`, `FormStatus`) and the two forms are rebuilt on the shared components from the foundation plan (`Field`, `Input`, `PasswordInput`, `Button`, `Alert`, `Card`), and the old tests keep proving nothing changed. Two things that were copied between files get one home each: the email check (`lib/auth-validation.ts`) and the brand mark (`components/layout/Brand.tsx`, also used by the app shell).

**Tech Stack:** React 19, React Router 7, TypeScript (strict), Tailwind v4 tokens, Vitest, Testing Library, jest-axe, Zustand.

**Spec:** `docs/superpowers/specs/2026-10-09-ui-redesign-design.md` (section 3, "Login and Signup"; delivery step 4). Depends on the foundation plan and the app shell plan being merged.

## Global Constraints

- Work in `frontend/`. Branch for this plan: `feature/ui-auth-pages` from an up-to-date `staging`. Only the user creates branches, commits and pushes.
- Behaviour does not change: the same validation rules and messages, the same API calls, the same redirect to the dashboard after login or signup, the same "Something went wrong" fallback.
- Token utilities only. No `slate-*`, `indigo-*`, `red-*` classes and no hex values in the files this plan touches.
- Interactive controls are at least 44 px tall (the shared `Input` and `Button` already are).
- Error messages stay announced: the status area above the form is always present (so a message appearing is announced), and field errors keep `role="alert"` (the shared `Field` already does this).
- Button labels stay `Log in` and `Sign up` (and `Logging in…` / `Signing up…` while submitting). Page headings change to `Welcome back` and `Create your account`.
- Verification commands, all run in `frontend/`: `npx tsc -b`, `npm run build` (then `rm -rf dist`), `npx eslint src`, `npx vitest run`. (`tsc --noEmit -p .` checks nothing here.)
- Code style: match the surrounding code (double quotes, 2-space indent, Prettier). Run `npx prettier --write <files>` before finishing a task.

## File Structure

Create:
- `src/components/auth/LoginForm.test.tsx`, `src/components/auth/SignupForm.test.tsx`
- `src/pages/LoginPage.test.tsx`, `src/pages/SignupPage.test.tsx`
- `src/lib/auth-validation.ts`, `src/lib/auth-validation.test.ts`
- `src/components/layout/Brand.tsx`, `src/components/layout/Brand.test.tsx`
- `src/components/auth/FormStatus.test.tsx`, `src/components/layout/AuthLayout.test.tsx`

Modify:
- `src/components/layout/AppShell.tsx` (use `Brand`)
- `src/components/auth/FormStatus.tsx`, `src/components/layout/AuthLayout.tsx`
- `src/pages/LoginPage.tsx`, `src/pages/SignupPage.tsx` (headings, footer links)
- `src/components/auth/LoginForm.tsx`, `src/components/auth/SignupForm.tsx`

Not touched: the API client, the auth store, routes, the shared `ui/` components.

---

### Task 1: Pin the current behaviour with tests

These tests are written against the code as it is today and must PASS before any production file changes. They avoid the things that will change on purpose (headings, button markup), so they keep guarding behaviour through the refactor.

**Files:**
- Create: `src/components/auth/LoginForm.test.tsx`, `src/components/auth/SignupForm.test.tsx`, `src/pages/LoginPage.test.tsx`, `src/pages/SignupPage.test.tsx`

**Interfaces:**
- Consumes (unchanged production code): `LoginForm({ onSubmit })`, `SignupForm({ onSubmit })`, `LoginPage`, `SignupPage`, `ApiError(status, message, fields?)` from `src/lib/api-client`, `login` and `signup` from `src/lib/auth-api`, `useAuthStore`, `ROUTES`.

- [ ] **Step 1: Write `src/components/auth/LoginForm.test.tsx`**

```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LoginForm } from "./LoginForm";

function renderForm(onSubmit = vi.fn().mockResolvedValue(undefined)) {
  render(<LoginForm onSubmit={onSubmit} />);
  return { onSubmit };
}

function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: "Log in" }));
}

describe("LoginForm", () => {
  it("has an email field, a password field and a submit button", () => {
    renderForm();

    expect(screen.getByLabelText("Email").getAttribute("type")).toBe("email");
    expect(screen.getByLabelText("Password").getAttribute("type")).toBe(
      "password",
    );
    expect(screen.getByRole("button", { name: "Log in" })).toBeDefined();
  });

  it("shows both errors and does not submit an empty form", () => {
    const { onSubmit } = renderForm();

    submit();

    expect(screen.getByText("Enter a valid email address")).toBeDefined();
    expect(screen.getByText("Password is required")).toBeDefined();
    expect(screen.getByLabelText("Email").getAttribute("aria-invalid")).toBe(
      "true",
    );
    expect(screen.getByLabelText("Password").getAttribute("aria-invalid")).toBe(
      "true",
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects an email without a domain but accepts the password", () => {
    const { onSubmit } = renderForm();
    fill("Email", "md@example");
    fill("Password", "secret");

    submit();

    expect(screen.getByText("Enter a valid email address")).toBeDefined();
    expect(screen.queryByText("Password is required")).toBeNull();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("links each error to its field", () => {
    renderForm();

    submit();

    const email = screen.getByLabelText("Email");
    const message = screen.getByText("Enter a valid email address");
    expect(email.getAttribute("aria-describedby")).toBe(
      message.id || message.parentElement?.id,
    );
  });

  it("submits the entered values", async () => {
    const { onSubmit } = renderForm();
    fill("Email", "md@example.com");
    fill("Password", "secret");

    submit();

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        email: "md@example.com",
        password: "secret",
      }),
    );
  });

  it("disables the fields and shows progress while submitting, then recovers", async () => {
    let finish: () => void = () => {};
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    renderForm(onSubmit);
    fill("Email", "md@example.com");
    fill("Password", "secret");

    submit();

    const busy = await screen.findByRole("button", { name: /Logging in/ });
    expect((busy as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByLabelText("Email") as HTMLInputElement).disabled).toBe(
      true,
    );
    expect(
      (screen.getByLabelText("Password") as HTMLInputElement).disabled,
    ).toBe(true);

    finish();

    const ready = await screen.findByRole("button", { name: "Log in" });
    expect((ready as HTMLButtonElement).disabled).toBe(false);
    expect((screen.getByLabelText("Email") as HTMLInputElement).disabled).toBe(
      false,
    );
  });
});
```

- [ ] **Step 2: Write `src/components/auth/SignupForm.test.tsx`**

```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SignupForm } from "./SignupForm";

function renderForm(onSubmit = vi.fn().mockResolvedValue(undefined)) {
  render(<SignupForm onSubmit={onSubmit} />);
  return { onSubmit };
}

function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: "Sign up" }));
}

describe("SignupForm", () => {
  it("has name, email and password fields and a submit button", () => {
    renderForm();

    expect(screen.getByLabelText("Name").getAttribute("type")).toBe("text");
    expect(screen.getByLabelText("Email").getAttribute("type")).toBe("email");
    expect(screen.getByLabelText("Password").getAttribute("type")).toBe(
      "password",
    );
    expect(screen.getByRole("button", { name: "Sign up" })).toBeDefined();
  });

  it("shows every error and does not submit an empty form", () => {
    const { onSubmit } = renderForm();

    submit();

    expect(screen.getByText("Name is required")).toBeDefined();
    expect(screen.getByText("Enter a valid email address")).toBeDefined();
    expect(
      screen.getByText("Password must be at least 8 characters"),
    ).toBeDefined();
    expect(
      screen.getByText("Password must contain a lowercase letter"),
    ).toBeDefined();
    expect(
      screen.getByText("Password must contain an uppercase letter"),
    ).toBeDefined();
    expect(screen.getByText("Password must contain a number")).toBeDefined();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("lists only the password rules that are broken", () => {
    renderForm();
    fill("Name", "Md");
    fill("Email", "md@example.com");
    fill("Password", "abcdefgh");

    submit();

    expect(
      screen.getByText("Password must contain an uppercase letter"),
    ).toBeDefined();
    expect(screen.getByText("Password must contain a number")).toBeDefined();
    expect(
      screen.queryByText("Password must be at least 8 characters"),
    ).toBeNull();
    expect(
      screen.queryByText("Password must contain a lowercase letter"),
    ).toBeNull();
  });

  it("rejects a password longer than 72 characters", () => {
    renderForm();
    fill("Name", "Md");
    fill("Email", "md@example.com");
    fill("Password", `Aa1${"x".repeat(70)}`);

    submit();

    expect(
      screen.getByText("Password must be at most 72 characters"),
    ).toBeDefined();
  });

  it("marks a field with errors as invalid", () => {
    renderForm();

    submit();

    expect(screen.getByLabelText("Name").getAttribute("aria-invalid")).toBe(
      "true",
    );
    expect(screen.getByLabelText("Password").getAttribute("aria-invalid")).toBe(
      "true",
    );
  });

  it("submits the values with the name trimmed", async () => {
    const { onSubmit } = renderForm();
    fill("Name", "  Md  ");
    fill("Email", "md@example.com");
    fill("Password", "Secret123");

    submit();

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        name: "Md",
        email: "md@example.com",
        password: "Secret123",
      }),
    );
  });

  it("disables the fields and shows progress while submitting", async () => {
    let finish: () => void = () => {};
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    renderForm(onSubmit);
    fill("Name", "Md");
    fill("Email", "md@example.com");
    fill("Password", "Secret123");

    submit();

    const busy = await screen.findByRole("button", { name: /Signing up/ });
    expect((busy as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByLabelText("Name") as HTMLInputElement).disabled).toBe(
      true,
    );

    finish();

    const ready = await screen.findByRole("button", { name: "Sign up" });
    expect((ready as HTMLButtonElement).disabled).toBe(false);
  });
});
```

- [ ] **Step 3: Write `src/pages/LoginPage.test.tsx`**

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../lib/api-client";
import { login } from "../lib/auth-api";
import { useAuthStore } from "../store/auth-store";
import { LoginPage } from "./LoginPage";

vi.mock("../lib/auth-api", () => ({ login: vi.fn() }));

const user = {
  id: "user-1",
  name: "Md Moinuddin",
  email: "md@example.com",
  createdAt: "2026-10-01T09:00:00.000Z",
};

function renderPage() {
  render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<p>Signup page</p>} />
        <Route path="/dashboard" element={<p>Dashboard page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

function logInWith(email: string, password: string) {
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: email },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: password },
  });
  fireEvent.click(screen.getByRole("button", { name: "Log in" }));
}

beforeEach(() => {
  vi.resetAllMocks();
});

afterEach(() => {
  useAuthStore.getState().clearAuth();
});

describe("LoginPage", () => {
  it("logs in, stores the session and opens the dashboard", async () => {
    vi.mocked(login).mockResolvedValue({ accessToken: "token", user });
    renderPage();

    logInWith("md@example.com", "secret");

    expect(await screen.findByText("Dashboard page")).toBeDefined();
    expect(login).toHaveBeenCalledWith({
      email: "md@example.com",
      password: "secret",
    });
    expect(useAuthStore.getState().user).toEqual(user);
    expect(useAuthStore.getState().accessToken).toBe("token");
  });

  it("shows the server's message when the login is rejected", async () => {
    vi.mocked(login).mockRejectedValue(
      new ApiError(401, "Invalid email or password"),
    );
    renderPage();

    logInWith("md@example.com", "wrong");

    const alert = await screen.findByText("Invalid email or password");
    expect(alert.closest('[role="alert"]')).not.toBeNull();
    expect(screen.queryByText("Dashboard page")).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("shows a generic message for any other failure", async () => {
    vi.mocked(login).mockRejectedValue(new Error("network down"));
    renderPage();

    logInWith("md@example.com", "secret");

    expect(await screen.findByText("Something went wrong")).toBeDefined();
  });

  it("clears the previous error when trying again", async () => {
    vi.mocked(login).mockRejectedValueOnce(
      new ApiError(401, "Invalid email or password"),
    );
    vi.mocked(login).mockResolvedValueOnce({ accessToken: "token", user });
    renderPage();
    logInWith("md@example.com", "wrong");
    await screen.findByText("Invalid email or password");

    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByText("Dashboard page")).toBeDefined();
  });

  it("links to the signup page", () => {
    renderPage();

    const link = screen.getByRole("link", { name: "Sign up" });
    expect(link.getAttribute("href")).toBe("/signup");
  });
});
```

- [ ] **Step 4: Write `src/pages/SignupPage.test.tsx`**

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../lib/api-client";
import { login, signup } from "../lib/auth-api";
import { useAuthStore } from "../store/auth-store";
import { SignupPage } from "./SignupPage";

vi.mock("../lib/auth-api", () => ({ login: vi.fn(), signup: vi.fn() }));

const user = {
  id: "user-1",
  name: "Md Moinuddin",
  email: "md@example.com",
  createdAt: "2026-10-01T09:00:00.000Z",
};

function renderPage() {
  render(
    <MemoryRouter initialEntries={["/signup"]}>
      <Routes>
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<p>Login page</p>} />
        <Route path="/dashboard" element={<p>Dashboard page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

function signUpWith(name: string, email: string, password: string) {
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: name } });
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: email },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: password },
  });
  fireEvent.click(screen.getByRole("button", { name: "Sign up" }));
}

beforeEach(() => {
  vi.resetAllMocks();
});

afterEach(() => {
  useAuthStore.getState().clearAuth();
});

describe("SignupPage", () => {
  it("creates the account, logs in and opens the dashboard", async () => {
    vi.mocked(signup).mockResolvedValue(user);
    vi.mocked(login).mockResolvedValue({ accessToken: "token", user });
    renderPage();

    signUpWith("Md Moinuddin", "md@example.com", "Secret123");

    expect(await screen.findByText("Dashboard page")).toBeDefined();
    expect(signup).toHaveBeenCalledWith({
      name: "Md Moinuddin",
      email: "md@example.com",
      password: "Secret123",
    });
    expect(login).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().user).toEqual(user);
  });

  it("shows the server's message and does not log in when signup is rejected", async () => {
    vi.mocked(signup).mockRejectedValue(
      new ApiError(409, "Email is already registered"),
    );
    renderPage();

    signUpWith("Md Moinuddin", "md@example.com", "Secret123");

    const alert = await screen.findByText("Email is already registered");
    expect(alert.closest('[role="alert"]')).not.toBeNull();
    expect(login).not.toHaveBeenCalled();
    expect(screen.queryByText("Dashboard page")).toBeNull();
  });

  it("shows a generic message for any other failure", async () => {
    vi.mocked(signup).mockRejectedValue(new Error("network down"));
    renderPage();

    signUpWith("Md Moinuddin", "md@example.com", "Secret123");

    expect(await screen.findByText("Something went wrong")).toBeDefined();
  });

  it("links to the login page", () => {
    renderPage();

    const link = screen.getByRole("link", { name: "Log in" });
    expect(link.getAttribute("href")).toBe("/login");
  });
});
```

- [ ] **Step 5: Run them against the UNCHANGED production code**

Run: `npx vitest run src/components/auth src/pages/LoginPage.test.tsx src/pages/SignupPage.test.tsx`
Expected: all pass (22 tests: LoginForm 6, SignupForm 7, LoginPage 5, SignupPage 4). These tests describe today's behaviour. If one fails, first check the test for a mistake; if the code really behaves differently from what the plan says, STOP and report the difference without changing production code. One known spot: "links each error to its field" accepts the id on the message element or on its parent (`message.id || message.parentElement?.id`) so it keeps passing after the shared `Field` takes over; do not tighten it.

- [ ] **Step 6: Typecheck, lint, format**

Run: `npx prettier --write src/components/auth/LoginForm.test.tsx src/components/auth/SignupForm.test.tsx src/pages/LoginPage.test.tsx src/pages/SignupPage.test.tsx && npx tsc -b && npx eslint src`
Expected: no output.

- [ ] **Step 7: Suggested commit (user runs it)**

```bash
git add frontend/src/components/auth/LoginForm.test.tsx frontend/src/components/auth/SignupForm.test.tsx frontend/src/pages/LoginPage.test.tsx frontend/src/pages/SignupPage.test.tsx
git commit -m "test(frontend): pin the login and signup behaviour before restyling them"
```

---

### Task 2: One email check and one brand mark

**Files:**
- Create: `src/lib/auth-validation.ts`, `src/lib/auth-validation.test.ts`, `src/components/layout/Brand.tsx`, `src/components/layout/Brand.test.tsx`
- Modify: `src/components/layout/AppShell.tsx` (the brand span), `src/components/auth/LoginForm.tsx` and `src/components/auth/SignupForm.tsx` (use `isValidEmail`)

**Interfaces:**
- Produces: `isValidEmail(email: string): boolean` and `Brand({ className?: string })` (renders a small accent diamond that is `aria-hidden`, followed by the text `Life Tracker`; the className is appended to the base `flex items-center gap-2 font-bold tracking-tight text-ink`).
- Consumes: `classNames` from `src/lib/class-names`.

- [ ] **Step 1: Write the failing tests**

`src/lib/auth-validation.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { isValidEmail } from "./auth-validation";

describe("isValidEmail", () => {
  it.each(["md@example.com", "a.b+c@sub.example.org", "x@y.z"])(
    "accepts %s",
    (email) => {
      expect(isValidEmail(email)).toBe(true);
    },
  );

  it.each(["", "md", "md@example", "@example.com", "md@@example.com", "md @example.com"])(
    "rejects %j",
    (email) => {
      expect(isValidEmail(email)).toBe(false);
    },
  );
});
```

`src/components/layout/Brand.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Brand } from "./Brand";

describe("Brand", () => {
  it("shows the product name", () => {
    render(<Brand />);

    expect(screen.getByText("Life Tracker")).toBeDefined();
  });

  it("hides the decorative mark from screen readers", () => {
    const { container } = render(<Brand />);

    expect(
      container.querySelector("[aria-hidden='true']")?.className,
    ).toContain("bg-accent");
  });

  it("appends extra classes to the base look", () => {
    render(<Brand className="text-base" />);

    const brand = screen.getByText("Life Tracker");
    expect(brand.className).toContain("text-base");
    expect(brand.className).toContain("font-bold");
  });
});
```

- [ ] **Step 2: Run them and see them fail**

Run: `npx vitest run src/lib/auth-validation.test.ts src/components/layout/Brand.test.tsx`
Expected: FAIL, cannot find the modules.

- [ ] **Step 3: Implement**

`src/lib/auth-validation.ts`:
```ts
// The one place that decides what counts as a valid email address on the
// login and signup forms.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email);
}
```

`src/components/layout/Brand.tsx`:
```tsx
import { classNames } from "../../lib/class-names";

interface BrandProps {
  className?: string;
}

// The product name with its accent mark, shared by the app shell and the
// login and signup pages.
export function Brand({ className }: BrandProps) {
  return (
    <span
      className={classNames(
        "flex items-center gap-2 font-bold tracking-tight text-ink",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="h-2.5 w-2.5 rotate-45 rounded-sm bg-accent"
      />
      Life Tracker
    </span>
  );
}
```

- [ ] **Step 4: Use them**

In `src/components/layout/AppShell.tsx`, add `import { Brand } from "./Brand";` next to the `AccountMenu` import and replace the whole brand `<span className="flex min-h-11 shrink-0 items-center gap-2 text-base font-bold tracking-tight text-ink">...Life Tracker</span>` element with:
```tsx
<Brand className="min-h-11 shrink-0 text-base" />
```
In `src/components/auth/LoginForm.tsx` and `src/components/auth/SignupForm.tsx`: delete the local `const EMAIL_PATTERN = ...` line, add `import { isValidEmail } from "../../lib/auth-validation";`, and change `!EMAIL_PATTERN.test(email)` to `!isValidEmail(email)`. Change nothing else in those two files in this task.

- [ ] **Step 5: Run everything that touches these files**

Run: `npx prettier --write src/lib/auth-validation.ts src/lib/auth-validation.test.ts src/components/layout/Brand.tsx src/components/layout/Brand.test.tsx src/components/layout/AppShell.tsx src/components/auth/LoginForm.tsx src/components/auth/SignupForm.tsx && npx vitest run src/lib/auth-validation.test.ts src/components/layout src/components/auth src/pages/LoginPage.test.tsx src/pages/SignupPage.test.tsx && npx tsc -b && npx eslint src`
Expected: all pass, no other output. The existing AppShell tests (`getByText("Life Tracker")`) and the Task 1 tests must still pass.

- [ ] **Step 6: Suggested commit (user runs it)**

```bash
git add frontend/src/lib/auth-validation.ts frontend/src/lib/auth-validation.test.ts frontend/src/components/layout/Brand.tsx frontend/src/components/layout/Brand.test.tsx frontend/src/components/layout/AppShell.tsx frontend/src/components/auth/LoginForm.tsx frontend/src/components/auth/SignupForm.tsx
git commit -m "refactor(frontend): share the email check and the brand mark"
```

---

### Task 3: Card layout, status alert, headings and footer links

**Files:**
- Modify: `src/components/auth/FormStatus.tsx`, `src/components/layout/AuthLayout.tsx`, `src/pages/LoginPage.tsx`, `src/pages/SignupPage.tsx`
- Create: `src/components/auth/FormStatus.test.tsx`, `src/components/layout/AuthLayout.test.tsx`
- Modify (tests from Task 1): `src/pages/LoginPage.test.tsx`, `src/pages/SignupPage.test.tsx` (add heading tests)

**Interfaces:**
- Consumes: `Alert` from `../ui/Alert` (tone `danger`, no role passed), `Card` from `../ui/Card`, `Brand` (Task 2), `LINK_CLASSES` from `../ui/links`, `ROUTES`.
- Produces:
  - `FormStatus({ message: string | null })`: always renders a `role="alert"` + `aria-live="assertive"` wrapper (so a message appearing is announced); empty it is `sr-only`; with a message it shows `<Alert tone="danger">{message}</Alert>` with a bottom margin.
  - `AuthLayout({ title, children, footer })`: same props as before. Renders a `<main>` with the brand, the tagline `Track work, shifts and earnings in one place`, a `Card` containing an `<h1>` with the title and the children, and the footer below.

- [ ] **Step 1: Write the failing tests**

`src/components/auth/FormStatus.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormStatus } from "./FormStatus";

describe("FormStatus", () => {
  it("keeps an empty live region on the page when there is no message", () => {
    render(<FormStatus message={null} />);

    const region = screen.getByRole("alert");
    expect(region.textContent).toBe("");
    expect(region.className).toContain("sr-only");
    expect(region.getAttribute("aria-live")).toBe("assertive");
  });

  it("shows the message in a danger alert inside the live region", () => {
    render(<FormStatus message="Invalid email or password" />);

    const region = screen.getByRole("alert");
    expect(region.textContent).toContain("Invalid email or password");
    expect(region.className).not.toContain("sr-only");
    expect(region.querySelector("svg")?.getAttribute("aria-hidden")).toBe(
      "true",
    );
  });

  it("announces only once: the inner alert has no role of its own", () => {
    render(<FormStatus message="Something went wrong" />);

    expect(screen.getAllByRole("alert")).toHaveLength(1);
  });
});
```

`src/components/layout/AuthLayout.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuthLayout } from "./AuthLayout";

function renderLayout() {
  render(
    <AuthLayout title="Welcome back" footer={<span>Footer text</span>}>
      <p>Form goes here</p>
    </AuthLayout>,
  );
}

describe("AuthLayout", () => {
  it("shows the brand and a tagline", () => {
    renderLayout();

    expect(screen.getByText("Life Tracker")).toBeDefined();
    expect(
      screen.getByText("Track work, shifts and earnings in one place"),
    ).toBeDefined();
  });

  it("has the title as the page heading", () => {
    renderLayout();

    expect(
      screen.getByRole("heading", { level: 1, name: "Welcome back" }),
    ).toBeDefined();
  });

  it("puts the form and the footer on the page", () => {
    renderLayout();

    expect(screen.getByText("Form goes here")).toBeDefined();
    expect(screen.getByText("Footer text")).toBeDefined();
  });

  it("is one main landmark", () => {
    renderLayout();

    expect(screen.getAllByRole("main")).toHaveLength(1);
  });

  it("uses no raw palette colours", () => {
    const { container } = render(
      <AuthLayout title="x" footer="y">
        z
      </AuthLayout>,
    );

    expect(container.innerHTML).not.toMatch(/slate-|indigo-|red-/);
  });
});
```

Add to `src/pages/LoginPage.test.tsx` (inside the `describe("LoginPage", ...)` block):
```tsx
  it("greets the user with the page heading", () => {
    renderPage();

    expect(
      screen.getByRole("heading", { level: 1, name: "Welcome back" }),
    ).toBeDefined();
  });
```
Add to `src/pages/SignupPage.test.tsx` (inside its `describe` block):
```tsx
  it("invites the user to create an account with the page heading", () => {
    renderPage();

    expect(
      screen.getByRole("heading", { level: 1, name: "Create your account" }),
    ).toBeDefined();
  });
```

- [ ] **Step 2: Run them and see them fail**

Run: `npx vitest run src/components/auth/FormStatus.test.tsx src/components/layout/AuthLayout.test.tsx src/pages/LoginPage.test.tsx src/pages/SignupPage.test.tsx`
Expected: FAIL (no Alert in FormStatus, no tagline or `main` in AuthLayout, old headings). The other Task 1 tests keep passing.

- [ ] **Step 3: Implement `FormStatus.tsx`**

```tsx
import { Alert } from "../ui/Alert";

interface FormStatusProps {
  message: string | null;
}

// The wrapper is always on the page, so a screen reader announces the message
// when it appears. The alert inside has no role of its own, to avoid two
// announcements.
export function FormStatus({ message }: FormStatusProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={message ? "mb-4" : "sr-only"}
    >
      {message && <Alert tone="danger">{message}</Alert>}
    </div>
  );
}
```

- [ ] **Step 4: Implement `AuthLayout.tsx`**

```tsx
import type { ReactNode } from "react";
import { Card } from "../ui/Card";
import { Brand } from "./Brand";

const TAGLINE = "Track work, shifts and earnings in one place";

interface AuthLayoutProps {
  title: string;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthLayout({ title, children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-4 py-12">
      <main className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Brand className="justify-center text-lg" />
          <p className="mt-1 text-sm text-ink-muted">{TAGLINE}</p>
        </div>
        <Card className="p-6">
          <h1 className="mb-6 text-xl font-bold text-ink">{title}</h1>
          {children}
        </Card>
        <p className="mt-4 text-center text-sm text-ink-muted">{footer}</p>
      </main>
    </div>
  );
}
```

- [ ] **Step 5: Update the pages**

`src/pages/LoginPage.tsx`: add `import { LINK_CLASSES } from "../components/ui/links";`; set `title="Welcome back"`; replace the footer link's long indigo `className` with `className={LINK_CLASSES}`. Change nothing else.
`src/pages/SignupPage.tsx`: same import; `title="Create your account"`; footer link `className={LINK_CLASSES}`.

- [ ] **Step 6: Run, typecheck, lint, format**

Run: `npx prettier --write src/components/auth/FormStatus.tsx src/components/auth/FormStatus.test.tsx src/components/layout/AuthLayout.tsx src/components/layout/AuthLayout.test.tsx src/pages/LoginPage.tsx src/pages/SignupPage.tsx src/pages/LoginPage.test.tsx src/pages/SignupPage.test.tsx && npx vitest run src/components src/pages/LoginPage.test.tsx src/pages/SignupPage.test.tsx src/pages/accessibility.test.tsx && npx tsc -b && npx eslint src`
Expected: all pass, no other output. The existing axe tests for both pages in `src/pages/accessibility.test.tsx` must still pass (a single `main`, one `h1`, labelled landmarks).

- [ ] **Step 7: Suggested commit (user runs it)**

```bash
git add frontend/src/components/auth/FormStatus.tsx frontend/src/components/auth/FormStatus.test.tsx frontend/src/components/layout/AuthLayout.tsx frontend/src/components/layout/AuthLayout.test.tsx frontend/src/pages/LoginPage.tsx frontend/src/pages/SignupPage.tsx frontend/src/pages/LoginPage.test.tsx frontend/src/pages/SignupPage.test.tsx
git commit -m "feat(frontend): restyle the login and signup pages as a centred card with a tagline"
```

---

### Task 4: LoginForm on the shared form components

**Files:**
- Modify: `src/components/auth/LoginForm.tsx` (whole file)

**Interfaces:**
- Consumes: `Button`, `Field`, `Input`, `PasswordInput` from `../ui/*`, `isValidEmail` (Task 2). `Field` passes `{ id, "aria-invalid", "aria-describedby" }` to its render prop and renders the errors in a `role="alert"` block.
- Produces: the same exports as today: `LoginFormValues` and `LoginForm({ onSubmit })`. The validation rules, messages and submit behaviour do not change.

- [ ] **Step 1: Confirm the safety net is green**

Run: `npx vitest run src/components/auth/LoginForm.test.tsx src/pages/LoginPage.test.tsx`
Expected: pass (these are the Task 1 tests; they must stay unchanged and green throughout this task).

- [ ] **Step 2: Replace `src/components/auth/LoginForm.tsx`**

```tsx
import { useState, type FormEvent } from "react";
import { isValidEmail } from "../../lib/auth-validation";
import { Button } from "../ui/Button";
import { Field } from "../ui/Field";
import { Input } from "../ui/Input";
import { PasswordInput } from "../ui/PasswordInput";

export interface LoginFormValues {
  email: string;
  password: string;
}

interface LoginFormProps {
  onSubmit: (values: LoginFormValues) => Promise<void>;
}

interface FormErrors {
  email?: string;
  password?: string;
}

function validate(email: string, password: string): FormErrors {
  const errors: FormErrors = {};

  if (!isValidEmail(email)) {
    errors.email = "Enter a valid email address";
  }
  if (password.length === 0) {
    errors.password = "Password is required";
  }

  return errors;
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validate(email, password);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      setIsSubmitting(true);
      try {
        await onSubmit({ email, password });
      } finally {
        setIsSubmitting(false);
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Field label="Email" errors={errors.email ? [errors.email] : []}>
        {(control) => (
          <Input
            {...control}
            type="email"
            autoComplete="email"
            required
            disabled={isSubmitting}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        )}
      </Field>

      <Field label="Password" errors={errors.password ? [errors.password] : []}>
        {(control) => (
          <PasswordInput
            {...control}
            autoComplete="current-password"
            required
            disabled={isSubmitting}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        )}
      </Field>

      <Button type="submit" loading={isSubmitting} className="w-full">
        {isSubmitting ? "Logging in…" : "Log in"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 3: Add the tests for what is new (the Show/Hide toggle)**

Append inside `describe("LoginForm", ...)` in `src/components/auth/LoginForm.test.tsx`:
```tsx
  it("can show and hide the password", () => {
    renderForm();
    fill("Password", "secret");

    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(screen.getByLabelText("Password").getAttribute("type")).toBe("text");

    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(screen.getByLabelText("Password").getAttribute("type")).toBe(
      "password",
    );
  });

  it("does not submit the form when the toggle is pressed", () => {
    const { onSubmit } = renderForm();

    fireEvent.click(screen.getByRole("button", { name: "Show password" }));

    expect(onSubmit).not.toHaveBeenCalled();
  });
```

- [ ] **Step 4: Run, typecheck, lint, format**

Run: `npx prettier --write src/components/auth/LoginForm.tsx src/components/auth/LoginForm.test.tsx && npx vitest run src/components/auth/LoginForm.test.tsx src/pages/LoginPage.test.tsx src/pages/accessibility.test.tsx && npx tsc -b && npx eslint src`
Expected: all pass, no other output. All the original (Task 1) LoginForm and LoginPage tests pass unchanged. If the "links each error to its field" test fails, the shared `Field` links errors through the wrapper's id: fix the component, not the test.

- [ ] **Step 5: Suggested commit (user runs it)**

```bash
git add frontend/src/components/auth/LoginForm.tsx frontend/src/components/auth/LoginForm.test.tsx
git commit -m "feat(frontend): build the login form on the shared fields with a show and hide password toggle"
```

---

### Task 5: SignupForm on the shared form components

**Files:**
- Modify: `src/components/auth/SignupForm.tsx` (whole file)
- Modify (test): `src/components/auth/SignupForm.test.tsx` (append tests)

**Interfaces:**
- Consumes: `Button`, `Field`, `Input`, `PasswordInput`, `isValidEmail`.
- Produces: the same exports as today: `SignupFormValues` and `SignupForm({ onSubmit })`. All rules and messages stay. The password rule messages now appear as separate lines inside the field's error block (they used to be a bulleted list).

- [ ] **Step 1: Confirm the safety net is green**

Run: `npx vitest run src/components/auth/SignupForm.test.tsx src/pages/SignupPage.test.tsx`
Expected: pass.

- [ ] **Step 2: Replace `src/components/auth/SignupForm.tsx`**

```tsx
import { useState, type FormEvent } from "react";
import { isValidEmail } from "../../lib/auth-validation";
import { Button } from "../ui/Button";
import { Field } from "../ui/Field";
import { Input } from "../ui/Input";
import { PasswordInput } from "../ui/PasswordInput";

export interface SignupFormValues {
  name: string;
  email: string;
  password: string;
}

interface SignupFormProps {
  onSubmit: (values: SignupFormValues) => Promise<void>;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string[];
}

function validate(name: string, email: string, password: string): FormErrors {
  const errors: FormErrors = {};

  if (name.trim().length === 0) {
    errors.name = "Name is required";
  }

  if (!isValidEmail(email)) {
    errors.email = "Enter a valid email address";
  }

  const passwordErrors: string[] = [];
  if (password.length < 8) {
    passwordErrors.push("Password must be at least 8 characters");
  }
  if (password.length > 72) {
    passwordErrors.push("Password must be at most 72 characters");
  }
  if (!/[a-z]/.test(password)) {
    passwordErrors.push("Password must contain a lowercase letter");
  }
  if (!/[A-Z]/.test(password)) {
    passwordErrors.push("Password must contain an uppercase letter");
  }
  if (!/[0-9]/.test(password)) {
    passwordErrors.push("Password must contain a number");
  }
  if (passwordErrors.length > 0) {
    errors.password = passwordErrors;
  }

  return errors;
}

export function SignupForm({ onSubmit }: SignupFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validate(name, email, password);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      setIsSubmitting(true);
      try {
        await onSubmit({ name: name.trim(), email, password });
      } finally {
        setIsSubmitting(false);
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Field label="Name" errors={errors.name ? [errors.name] : []}>
        {(control) => (
          <Input
            {...control}
            type="text"
            autoComplete="name"
            required
            disabled={isSubmitting}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        )}
      </Field>

      <Field label="Email" errors={errors.email ? [errors.email] : []}>
        {(control) => (
          <Input
            {...control}
            type="email"
            autoComplete="email"
            required
            disabled={isSubmitting}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        )}
      </Field>

      <Field label="Password" errors={errors.password ?? []}>
        {(control) => (
          <PasswordInput
            {...control}
            autoComplete="new-password"
            required
            disabled={isSubmitting}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        )}
      </Field>

      <Button type="submit" loading={isSubmitting} className="w-full">
        {isSubmitting ? "Signing up…" : "Sign up"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 3: Add the tests for what is new**

Append inside `describe("SignupForm", ...)` in `src/components/auth/SignupForm.test.tsx`:
```tsx
  it("can show and hide the password", () => {
    renderForm();

    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(screen.getByLabelText("Password").getAttribute("type")).toBe("text");

    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(screen.getByLabelText("Password").getAttribute("type")).toBe(
      "password",
    );
  });

  it("asks the browser to offer a new password, not the saved one", () => {
    renderForm();

    expect(screen.getByLabelText("Password").getAttribute("autocomplete")).toBe(
      "new-password",
    );
  });

  it("announces all the password problems together", () => {
    renderForm();

    submit();

    const password = screen.getByLabelText("Password");
    const errorBlock = document.getElementById(
      password.getAttribute("aria-describedby") ?? "",
    );
    expect(errorBlock?.getAttribute("role")).toBe("alert");
    expect(errorBlock?.querySelectorAll("p")).toHaveLength(4);
  });
```

- [ ] **Step 4: Run, typecheck, lint, format**

Run: `npx prettier --write src/components/auth/SignupForm.tsx src/components/auth/SignupForm.test.tsx && npx vitest run src/components/auth src/pages/SignupPage.test.tsx src/pages/accessibility.test.tsx && npx tsc -b && npx eslint src`
Expected: all pass, no other output. All original SignupForm and SignupPage tests pass unchanged.

- [ ] **Step 5: Suggested commit (user runs it)**

```bash
git add frontend/src/components/auth/SignupForm.tsx frontend/src/components/auth/SignupForm.test.tsx
git commit -m "feat(frontend): build the signup form on the shared fields with a show and hide password toggle"
```

---

### Task 6: Final checks and the browser pass

**Files:** none created. This task only verifies and reports.

- [ ] **Step 1: Look for leftovers**

Run:
```bash
grep -rn "slate-\|indigo-\|red-[0-9]" src/components/auth src/components/layout src/pages/LoginPage.tsx src/pages/SignupPage.tsx
grep -rn "INPUT_CLASSES\|PRIMARY_BUTTON_CLASSES\|form-styles" src/components/auth src/pages/LoginPage.tsx src/pages/SignupPage.tsx
grep -rn "EMAIL_PATTERN" src
```
Expected: the first two print nothing; the third prints only `src/lib/auth-validation.ts`.

- [ ] **Step 2: Run the full CI set**

Run:
```bash
npx prettier --check src/components/auth src/components/layout src/pages src/lib
npx tsc -b && echo TSC_OK
npm run build 2>&1 | grep -E "built|error"
rm -rf dist
npx eslint src && echo LINT_OK
npx vitest run 2>&1 | grep -E "Test Files|Tests|FAIL"
git status --short
```
Expected: `TSC_OK`, `built in ...`, `LINT_OK`, all tests pass, and `git status` shows only the files named in this plan.

- [ ] **Step 3: Browser pass (the user does this)**

Run the app and check `/login` and `/signup` (log out first):
1. A centred card on the soft page background, the brand with its small accent diamond, the tagline, the heading "Welcome back" (login) or "Create your account" (signup), and the footer link in the accent colour.
2. Press the Show button next to the password: the characters appear and the button changes to Hide. Press Hide: they are hidden again. The Tab order is Email, Password, the Show button, the submit button.
3. Submit the empty login form: red-tinted messages under Email and Password, the inputs get a red border, and focus stays where it is. On signup, an empty submit shows the four password rules together.
4. Log in with a wrong password: a red alert with an icon appears above the form with the server's message.
5. Log in correctly: you land on the dashboard with the new top bar. Sign up a new test account: same.
6. At a phone width (360 px) the card fills the width with side padding and nothing scrolls sideways. All tap targets are easy to hit.
7. Keyboard only: every control shows a visible focus ring; with a screen reader (or just reading the DOM) the error alert is read out when it appears.

- [ ] **Step 4: Suggested commit (user runs it)**

Nothing new to commit unless Step 1 or 2 led to a fix. Then push the branch and open the PR into `staging`.
