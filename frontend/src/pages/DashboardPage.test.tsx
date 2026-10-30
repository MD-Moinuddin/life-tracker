import { fireEvent, render, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { listJobs } from "../lib/jobs-api";
import type { JobWithShiftCount } from "../lib/jobs-api";
import { createShift, listShifts } from "../lib/shifts-api";
import { getSummary } from "../lib/summary-api";
import type { Summary } from "../lib/summary-api";
import { useAuthStore } from "../store/auth-store";
import { makeShift } from "../test/fixtures";
import { DashboardPage } from "./DashboardPage";

vi.mock("../lib/summary-api", () => ({ getSummary: vi.fn() }));
vi.mock("../lib/jobs-api", () => ({ listJobs: vi.fn() }));
vi.mock("../lib/shifts-api", () => ({
  listShifts: vi.fn(),
  createShift: vi.fn(),
}));
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

const warehouse: JobWithShiftCount = {
  id: "job-1",
  name: "Warehouse",
  hourlyRate: "12.00",
  type: "part_time",
  createdAt: "2026-10-01T09:00:00.000Z",
  updatedAt: "2026-10-01T09:00:00.000Z",
  shiftCount: 3,
};

// An evening shift today, so it has not ended at the mocked time (19:30).
const eveningShift = makeShift({
  id: "today",
  date: "2026-10-07",
  startTime: "20:00",
  endTime: "23:00",
  endDate: "2026-10-07",
  workedMinutes: 180,
});

function mockShifts(items = [eveningShift]) {
  vi.mocked(listShifts).mockResolvedValue({
    items,
    total: items.length,
    limit: 500,
    offset: 0,
  });
}

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
  vi.mocked(listJobs).mockResolvedValue([warehouse]);
  mockShifts();
  useAuthStore.setState({ user, accessToken: "token" });
});

afterEach(() => {
  useAuthStore.getState().clearAuth();
});

describe("DashboardPage", () => {
  it("greets the user by first name for the time of day, with the date", async () => {
    renderPage();

    expect(
      screen.getByRole("heading", { level: 1, name: "Good evening, Md" }),
    ).toBeDefined();
    expect(screen.getByText("Wednesday 7 October")).toBeDefined();
    await screen.findByText("€96.00");
  });

  it("asks for this week's summary with the browser's local time", async () => {
    renderPage();

    await screen.findByText("€96.00");
    expect(getSummary).toHaveBeenCalledWith({
      range: "week",
      date: "2026-10-07",
      now: "2026-10-07T19:30",
    });
  });

  it("leads the week card with what was earned", async () => {
    renderPage();

    expect(await screen.findByText("€96.00")).toBeDefined();
    expect(screen.getByText("earned · 8h finished")).toBeDefined();
    expect(screen.getByText("€252.75 · 20h 30m")).toBeDefined();
  });

  it("shows today's shifts next to the week", async () => {
    renderPage();

    expect(
      await screen.findByRole("heading", { level: 2, name: "Today" }),
    ).toBeDefined();
    expect(screen.getByText("Warehouse")).toBeDefined();
  });

  it("asks for the upcoming shifts once, not the whole history", async () => {
    renderPage();
    await screen.findByText("€96.00");

    expect(listShifts).toHaveBeenCalledTimes(1);
  });

  it("shows the planned modules as quiet chips, not cards", async () => {
    renderPage();
    await screen.findByText("€96.00");

    const soon = screen.getByRole("region", { name: "Coming soon" });
    expect(
      within(soon)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(["Fitness", "Nutrition", "Finance"]);
  });

  it("still shows the greeting and the chips when the week cannot be loaded", async () => {
    vi.mocked(getSummary).mockRejectedValue(new Error("network down"));
    renderPage();

    expect(await screen.findByRole("alert")).toBeDefined();
    expect(
      screen.getByRole("heading", { level: 1, name: "Good evening, Md" }),
    ).toBeDefined();
    expect(screen.getByRole("region", { name: "Coming soon" })).toBeDefined();
  });

  it("floats the Add shift button on a phone", async () => {
    renderPage();

    const add = await screen.findByRole("button", { name: "Add shift" });
    expect(add.className).toContain("max-sm:fixed");
  });

  it("adds a shift from a dialog and refreshes the week and the shifts", async () => {
    vi.mocked(createShift).mockResolvedValue(makeShift());
    renderPage();
    await screen.findByText("€96.00");

    fireEvent.click(screen.getByRole("button", { name: "Add shift" }));
    const dialog = await screen.findByRole("dialog", { name: "Add a shift" });
    fireEvent.change(await within(dialog).findByLabelText("Job"), {
      target: { value: "job-1" },
    });
    fireEvent.change(within(dialog).getByLabelText("Start time"), {
      target: { value: "09:00" },
    });
    fireEvent.change(within(dialog).getByLabelText("End time"), {
      target: { value: "17:00" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Add shift" }));

    await vi.waitFor(() => expect(createShift).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => expect(getSummary).toHaveBeenCalledTimes(2));
    expect(listShifts).toHaveBeenCalledTimes(2);
    expect(listJobs).toHaveBeenCalledTimes(2);
  });

  it("shows the set-up steps, and no Add shift button, with no job yet", async () => {
    vi.mocked(listJobs).mockResolvedValue([]);
    renderPage();

    expect(await screen.findByText("Add your first job")).toBeDefined();
    expect(screen.queryByRole("button", { name: "Add shift" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Today" })).toBeNull();
  });

  it("keeps the set-up steps until the first shift, and then offers the shift dialog", async () => {
    vi.mocked(listJobs).mockResolvedValue([{ ...warehouse, shiftCount: 0 }]);
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Add shift" }));

    expect(
      await screen.findByRole("dialog", { name: "Add a shift" }),
    ).toBeDefined();
  });

  it("has no accessibility violations once everything has loaded", async () => {
    const { container } = renderPage();
    await screen.findByText("€96.00");
    await screen.findByRole("heading", { level: 2, name: "Today" });

    expect((await axe(container)).violations).toHaveLength(0);
  });

  it("has no accessibility violations in the error state", async () => {
    vi.mocked(getSummary).mockRejectedValue(new Error("network down"));
    const { container } = renderPage();
    await screen.findByRole("alert");

    expect((await axe(container)).violations).toHaveLength(0);
  });

  it("has no accessibility violations in the set-up state", async () => {
    vi.mocked(listJobs).mockResolvedValue([]);
    const { container } = renderPage();
    await screen.findByText("Add your first job");

    expect((await axe(container)).violations).toHaveLength(0);
  });
});
