import { fireEvent, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "../components/layout/AppShell";
import { listJobs } from "../lib/jobs-api";
import type { JobWithShiftCount } from "../lib/jobs-api";
import { listShifts } from "../lib/shifts-api";
import { getSummary } from "../lib/summary-api";
import type { Summary } from "../lib/summary-api";
import { useAuthStore } from "../store/auth-store";
import { makeShift } from "../test/fixtures";
import { DashboardPage } from "./DashboardPage";
import { ForgotPasswordPage } from "./ForgotPasswordPage";
import { JobDetailPage } from "./JobDetailPage";
import { JobsPage } from "./JobsPage";
import { LandingPage } from "./LandingPage";
import { LoginPage } from "./LoginPage";
import { ResetPasswordPage } from "./ResetPasswordPage";
import { ShiftsPage } from "./ShiftsPage";
import { SignupPage } from "./SignupPage";
import { SummaryPage } from "./SummaryPage";

vi.mock("../lib/summary-api", () => ({ getSummary: vi.fn() }));
vi.mock("../lib/jobs-api", () => ({ listJobs: vi.fn() }));
vi.mock("../lib/shifts-api", () => ({ listShifts: vi.fn() }));
vi.mock("../lib/dates", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/dates")>()),
  localNow: () => "2026-10-07T12:00",
}));

const weekSummary: Summary = {
  from: "2026-10-05",
  to: "2026-10-11",
  jobs: [],
  totals: {
    earnedMinutes: 0,
    plannedMinutes: 0,
    earnedAmount: "0.00",
    plannedAmount: "0.00",
  },
};
const warehouse: JobWithShiftCount = {
  id: "job-1",
  name: "Warehouse",
  hourlyRate: "12.00",
  type: "part_time",
  createdAt: "2026-10-01T09:00:00.000Z",
  updatedAt: "2026-10-01T09:00:00.000Z",
  shiftCount: 2,
};
const cafe: JobWithShiftCount = {
  ...warehouse,
  id: "job-2",
  name: "Café",
  hourlyRate: "13.00",
  type: "mini_job",
  shiftCount: 1,
};
const monthSummary: Summary = {
  from: "2026-10-01",
  to: "2026-10-31",
  jobs: [
    {
      jobId: "job-1",
      name: "Warehouse",
      type: "part_time",
      hourlyRate: "12.00",
      earnedMinutes: 480,
      plannedMinutes: 960,
      earnedAmount: "96.00",
      plannedAmount: "192.00",
    },
    {
      jobId: "job-2",
      name: "Café",
      type: "mini_job",
      hourlyRate: "13.00",
      earnedMinutes: 600,
      plannedMinutes: 2400,
      earnedAmount: "130.00",
      plannedAmount: "520.00",
    },
  ],
  totals: {
    earnedMinutes: 1080,
    plannedMinutes: 3360,
    earnedAmount: "226.00",
    plannedAmount: "712.00",
  },
  miniJob: { plannedAmount: "560.00", threshold: "540.00", warning: true },
};
const futureLabel = "Warehouse, Fri 9 Oct, 09:00 to 17:00";

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getSummary).mockResolvedValue(weekSummary);
  vi.mocked(listJobs).mockResolvedValue([warehouse, cafe]);
  vi.mocked(listShifts).mockResolvedValue({
    items: [
      makeShift({ id: "ended", date: "2026-10-05" }),
      makeShift({ id: "future", date: "2026-10-09" }),
    ],
    total: 2,
    limit: 500,
    offset: 0,
  });
});

describe("accessibility", () => {
  it("LoginPage has no violations", async () => {
    const { container } = render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });

  it("LoginPage has no violations with a notice", async () => {
    const { container } = render(
      <MemoryRouter
        initialEntries={[{ pathname: "/login", state: { notice: "Done." } }]}
      >
        <LoginPage />
      </MemoryRouter>,
    );

    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });

  it("SignupPage has no violations", async () => {
    const { container } = render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>,
    );

    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });

  it("ForgotPasswordPage has no violations", async () => {
    const { container } = render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });

  it("ResetPasswordPage has no violations, with a token and without", async () => {
    const withToken = render(
      <MemoryRouter initialEntries={["/reset-password?token=abc123"]}>
        <ResetPasswordPage />
      </MemoryRouter>,
    );
    expect((await axe(withToken.container)).violations).toHaveLength(0);
    withToken.unmount();

    const withoutToken = render(
      <MemoryRouter initialEntries={["/reset-password"]}>
        <ResetPasswordPage />
      </MemoryRouter>,
    );
    expect((await axe(withoutToken.container)).violations).toHaveLength(0);
  });

  it("LandingPage has no violations", async () => {
    useAuthStore.setState({ isInitialized: true });
    const { container } = render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    const results = await axe(container);
    useAuthStore.setState({ isInitialized: false });
    expect(results.violations).toHaveLength(0);
  });

  it("DashboardPage has no violations", async () => {
    const { container } = render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    await screen.findByText("No shifts this week yet.");
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });

  it("JobsPage has no violations, with the add dialog open", async () => {
    const { container } = render(
      <MemoryRouter>
        <JobsPage />
      </MemoryRouter>,
    );

    await screen.findByText("Warehouse");
    expect((await axe(container)).violations).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: "Add job" }));
    await screen.findByRole("dialog");
    expect((await axe(document.body)).violations).toHaveLength(0);
  });

  it("JobDetailPage has no violations", async () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/jobs/job-1"]}>
        <Routes>
          <Route path="/jobs/:id" element={<JobDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByRole("heading", { level: 1, name: "Warehouse" });
    expect((await axe(container)).violations).toHaveLength(0);
  });

  it("ShiftsPage has no violations in the list, its menu, the week view and the add dialog", async () => {
    const { container } = render(
      <MemoryRouter>
        <ShiftsPage />
      </MemoryRouter>,
    );

    const menu = await screen.findByRole("button", {
      name: `Actions for ${futureLabel}`,
    });
    expect((await axe(container)).violations).toHaveLength(0);

    fireEvent.click(menu);
    await screen.findByRole("menu");
    expect((await axe(container)).violations).toHaveLength(0);
    fireEvent.keyDown(document, { key: "Escape" });

    fireEvent.click(screen.getByRole("button", { name: "Week" }));
    await screen.findByRole("region", { name: "Week view" });
    await screen.findByRole("button", { name: `Edit ${futureLabel}` });
    expect((await axe(container)).violations).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: "Add shift" }));
    await screen.findByRole("dialog");
    expect((await axe(document.body)).violations).toHaveLength(0);
  });

  it("SummaryPage has no violations in week view and in month view with the mini-job warning", async () => {
    vi.mocked(getSummary).mockImplementation(async ({ range }) =>
      range === "month" ? monthSummary : weekSummary,
    );
    const { container } = render(
      <MemoryRouter>
        <SummaryPage />
      </MemoryRouter>,
    );

    await screen.findByText("No shifts this week");
    expect((await axe(container)).violations).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: "Month" }));
    await screen.findByText("Mini-job warning.");
    await screen.findByRole("list", { name: /Earnings by job/ });
    await screen.findByRole("progressbar", { name: /mini-job earnings/i });
    expect((await axe(container)).violations).toHaveLength(0);
  });

  it("SummaryPage has no violations in week view with data", async () => {
    vi.mocked(getSummary).mockResolvedValue({
      ...monthSummary,
      from: "2026-10-05",
      to: "2026-10-11",
      miniJob: undefined,
    });
    const { container } = render(
      <MemoryRouter>
        <SummaryPage />
      </MemoryRouter>,
    );

    await screen.findByRole("list", { name: /Earnings by job/ });
    expect((await axe(container)).violations).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: "Table" }));
    await screen.findByRole("table");
    expect((await axe(container)).violations).toHaveLength(0);
  });

  it("the app shell has no violations, with the account menu open", async () => {
    useAuthStore.setState({
      user: {
        id: "user-1",
        name: "Md Moinuddin",
        email: "md@example.com",
        createdAt: "2026-10-01T09:00:00.000Z",
      },
      accessToken: "token",
    });
    try {
      render(
        <MemoryRouter initialEntries={["/dashboard"]}>
          <AppShell>
            <p>content</p>
          </AppShell>
        </MemoryRouter>,
      );

      const menuButton = screen.getByRole("button", { name: /Account menu/ });
      fireEvent.click(menuButton);
      expect(menuButton.getAttribute("aria-expanded")).toBe("true");
      await screen.findByText("md@example.com");
      expect((await axe(document.body)).violations).toHaveLength(0);
    } finally {
      useAuthStore.getState().clearAuth();
    }
  });
});
