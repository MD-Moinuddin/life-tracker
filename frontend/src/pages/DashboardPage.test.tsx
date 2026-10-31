import { fireEvent, render, screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { MemoryRouter } from "react-router-dom";
import { ToastProvider } from "../components/ui/ToastProvider";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { listJobs } from "../lib/jobs-api";
import type { JobWithShiftCount } from "../lib/jobs-api";
import { createShift, listShifts } from "../lib/shifts-api";
import { createLeave, listLeave } from "../lib/leave-api";
import { getSummary } from "../lib/summary-api";
import type { Summary } from "../lib/summary-api";
import { useAuthStore } from "../store/auth-store";
import { makeLeave, makeShift, noLeave, noVacation } from "../test/fixtures";
import { DashboardPage } from "./DashboardPage";

vi.mock("../lib/summary-api", () => ({ getSummary: vi.fn() }));
vi.mock("../lib/jobs-api", () => ({ listJobs: vi.fn() }));
vi.mock("../lib/shifts-api", () => ({
  listShifts: vi.fn(),
  createShift: vi.fn(),
}));
vi.mock("../lib/leave-api", () => ({
  listLeave: vi.fn(),
  createLeave: vi.fn(),
  updateLeave: vi.fn(),
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
      leave: noLeave,
    },
  ],
  totals: {
    earnedMinutes: 480,
    plannedMinutes: 1230,
    earnedAmount: "96.00",
    plannedAmount: "252.75",
    leave: noLeave,
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
  ...noVacation,
};

const cafe: JobWithShiftCount = {
  ...warehouse,
  id: "job-2",
  name: "Cafe",
  vacationHoursPerYear: "80.00",
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
    <ToastProvider>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </ToastProvider>,
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
    await vi.waitFor(() =>
      expect(screen.getByRole("status").textContent).toBe("Shift added"),
    );
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

  describe("paid vacation card", () => {
    const booked = makeLeave({
      jobId: "job-2",
      startDate: "2026-09-07",
      endDate: "2026-09-11",
      minutesPerDay: 480,
    });
    const later = makeLeave({
      id: "leave-2",
      jobId: "job-2",
      startDate: "2026-12-28",
      endDate: "2026-12-29",
      minutesPerDay: 240,
    });

    beforeEach(() => {
      vi.mocked(listJobs).mockResolvedValue([warehouse, cafe]);
      vi.mocked(listLeave).mockResolvedValue([booked, later]);
    });

    it("shows the balance of the job that tracks vacation", async () => {
      renderPage();

      const card = within(
        await screen.findByRole("region", { name: "Paid vacation" }),
      );
      expect(card.getByText("32h")).toBeDefined();
      expect(card.getByText("left of 80h")).toBeDefined();
      expect(card.getByText("Next: 28 Dec to 29 Dec")).toBeDefined();
      expect(listLeave).toHaveBeenCalledWith({
        from: "2026-01-01",
        to: "2026-12-31",
      });
    });

    it("says nothing is planned when all leave is over", async () => {
      vi.mocked(listLeave).mockResolvedValue([booked]);
      renderPage();

      await screen.findByText("Nothing planned");
    });

    it("ignores the leave of a job that does not track vacation", async () => {
      vi.mocked(listLeave).mockResolvedValue([
        booked,
        makeLeave({
          id: "x",
          jobId: "job-1",
          startDate: "2026-11-02",
          endDate: "2026-11-06",
        }),
      ]);
      renderPage();

      const card = within(
        await screen.findByRole("region", { name: "Paid vacation" }),
      );
      expect(card.getByText("40h")).toBeDefined();
    });

    it("shows a row per tracking job", async () => {
      vi.mocked(listJobs).mockResolvedValue([
        { ...warehouse, vacationHoursPerYear: "40.00" },
        cafe,
      ]);
      renderPage();

      const list = await screen.findByRole("list", {
        name: "Paid vacation by job",
      });
      expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    });

    it("shows over by in words when the year is overbooked", async () => {
      vi.mocked(listLeave).mockResolvedValue([
        makeLeave({
          jobId: "job-2",
          startDate: "2026-10-12",
          endDate: "2026-10-26",
          minutesPerDay: 480,
        }),
      ]);
      renderPage();

      await screen.findByText("over by 8h");
    });

    it("shows no card and asks for no leave when no job tracks vacation", async () => {
      vi.mocked(listJobs).mockResolvedValue([warehouse]);
      renderPage();

      await screen.findByText("€96.00");
      expect(
        screen.queryByRole("region", { name: "Paid vacation" }),
      ).toBeNull();
      expect(listLeave).not.toHaveBeenCalled();
    });

    it("shows a loading text while the leave loads", async () => {
      vi.mocked(listLeave).mockReturnValue(new Promise(() => {}));
      renderPage();

      expect(
        await screen.findByText("Loading your paid vacation…"),
      ).toBeDefined();
    });

    it("renders nothing for the card when the leave cannot be loaded", async () => {
      vi.mocked(listLeave).mockRejectedValue(new Error("network down"));
      renderPage();

      await screen.findByText("€96.00");
      await vi.waitFor(() =>
        expect(screen.queryByText("Loading your paid vacation…")).toBeNull(),
      );
      expect(
        screen.queryByRole("region", { name: "Paid vacation" }),
      ).toBeNull();
      expect(screen.queryByRole("alert")).toBeNull();
      expect(screen.getByRole("region", { name: "Coming soon" })).toBeDefined();
    });

    it("books leave from the card and reloads the leave", async () => {
      vi.mocked(createLeave).mockResolvedValue(booked);
      renderPage();

      const card = within(
        await screen.findByRole("region", { name: "Paid vacation" }),
      );
      fireEvent.click(card.getByRole("button", { name: "Add paid leave" }));
      const dialog = await screen.findByRole("dialog", {
        name: "Add paid leave",
      });
      fireEvent.change(await within(dialog).findByLabelText("From"), {
        target: { value: "2026-11-02" },
      });
      fireEvent.change(within(dialog).getByLabelText("To"), {
        target: { value: "2026-11-02" },
      });
      fireEvent.click(
        within(dialog).getByRole("button", { name: "Add paid leave" }),
      );

      await vi.waitFor(() => expect(createLeave).toHaveBeenCalledTimes(1));
      await vi.waitFor(() => expect(listLeave).toHaveBeenCalledTimes(2));
    });

    // The upcoming shifts, not the dialog's look-up of clashing shifts.
    const upcomingRequests = () =>
      vi
        .mocked(listShifts)
        .mock.calls.filter(([params]) => params?.to === undefined).length;

    async function bookLeave() {
      const card = within(
        await screen.findByRole("region", { name: "Paid vacation" }),
      );
      const counts = {
        summary: vi.mocked(getSummary).mock.calls.length,
        shifts: upcomingRequests(),
        jobs: vi.mocked(listJobs).mock.calls.length,
      };
      fireEvent.click(card.getByRole("button", { name: "Add paid leave" }));
      const dialog = await screen.findByRole("dialog", {
        name: "Add paid leave",
      });
      fireEvent.change(await within(dialog).findByLabelText("From"), {
        target: { value: "2026-11-02" },
      });
      fireEvent.change(within(dialog).getByLabelText("To"), {
        target: { value: "2026-11-02" },
      });
      fireEvent.click(
        within(dialog).getByRole("button", { name: "Add paid leave" }),
      );
      await vi.waitFor(() => expect(createLeave).toHaveBeenCalledTimes(1));
      await vi.waitFor(() => expect(listLeave).toHaveBeenCalledTimes(2));
      return counts;
    }

    it("reloads the week too after booking, since leave counts in it, but not the shifts", async () => {
      vi.mocked(createLeave).mockResolvedValue(booked);
      renderPage();

      const before = await bookLeave();

      await vi.waitFor(() =>
        expect(vi.mocked(getSummary).mock.calls.length).toBe(
          before.summary + 1,
        ),
      );
      expect(upcomingRequests()).toBe(before.shifts);
      expect(vi.mocked(listJobs).mock.calls.length).toBe(before.jobs);
    });

    it("reloads the week, the shifts and the jobs after a booking that removed shifts", async () => {
      vi.mocked(createLeave).mockResolvedValue({ ...booked, removedShifts: 1 });
      renderPage();

      const before = await bookLeave();

      await vi.waitFor(() => {
        expect(vi.mocked(getSummary).mock.calls.length).toBe(
          before.summary + 1,
        );
        expect(upcomingRequests()).toBe(before.shifts + 1);
        expect(vi.mocked(listJobs).mock.calls.length).toBe(before.jobs + 1);
      });
    });
  });
});
