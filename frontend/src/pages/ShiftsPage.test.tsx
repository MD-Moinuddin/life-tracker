import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ToastProvider } from "../components/ui/ToastProvider";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../lib/api-client";
import { listJobs } from "../lib/jobs-api";
import type { JobWithShiftCount } from "../lib/jobs-api";
import {
  createShift,
  deleteShift,
  listShifts,
  updateShift,
} from "../lib/shifts-api";
import type { Shift } from "../lib/shifts-api";
import {
  createLeave,
  deleteLeave,
  listLeave,
  updateLeave,
} from "../lib/leave-api";
import { PHONE_QUERY } from "../lib/breakpoints";
import { makeLeave, makeShift, noVacation } from "../test/fixtures";
import { ShiftsPage } from "./ShiftsPage";
import source from "./ShiftsPage.tsx?raw";

vi.mock("../lib/shifts-api", () => ({
  listShifts: vi.fn(),
  createShift: vi.fn(),
  updateShift: vi.fn(),
  deleteShift: vi.fn(),
}));
vi.mock("../lib/jobs-api", () => ({ listJobs: vi.fn() }));
vi.mock("../lib/leave-api", () => ({
  listLeave: vi.fn(),
  createLeave: vi.fn(),
  updateLeave: vi.fn(),
  deleteLeave: vi.fn(),
}));
vi.mock("../lib/dates", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/dates")>()),
  localNow: () => "2026-10-07T12:00",
}));

const ended = makeShift({ id: "ended", date: "2026-10-05" });
const endedOvernight = makeShift({
  id: "ended-overnight",
  date: "2026-10-06",
  startTime: "22:00",
  endTime: "02:00",
  endDate: "2026-10-07",
  workedMinutes: 240,
});
const inProgress = makeShift({
  id: "in-progress",
  date: "2026-10-07",
  startTime: "10:00",
  endTime: "14:00",
  endDate: "2026-10-07",
  workedMinutes: 240,
});
const future = makeShift({ id: "future", date: "2026-10-09" });
const futureLabel = "Warehouse, Fri 9 Oct, 09:00 to 17:00";
const warehouse: JobWithShiftCount = {
  id: "job-1",
  name: "Warehouse",
  hourlyRate: "12.00",
  type: "part_time",
  createdAt: "2026-10-01T09:00:00.000Z",
  updatedAt: "2026-10-01T09:00:00.000Z",
  shiftCount: 0,
  ...noVacation,
};

function mockShifts(items: Shift[]) {
  vi.mocked(listShifts).mockResolvedValue({
    items,
    total: items.length,
    limit: 500,
    offset: 0,
  });
}

function renderPage() {
  render(
    <ToastProvider>
      <MemoryRouter>
        <ShiftsPage />
      </MemoryRouter>
    </ToastProvider>,
  );
}

function section(name: string) {
  return within(screen.getByRole("region", { name }));
}

function showHistory() {
  fireEvent.click(screen.getByRole("button", { name: "History" }));
}

async function chooseAction(label: string, action: string) {
  fireEvent.click(
    await screen.findByRole("button", { name: `Actions for ${label}` }),
  );
  fireEvent.click(screen.getByRole("menuitem", { name: action }));
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(listJobs).mockResolvedValue([warehouse]);
});

describe("ShiftsPage", () => {
  it("has the Add shift button in the page header next to the title", async () => {
    mockShifts([]);

    renderPage();

    const heading = await screen.findByRole("heading", {
      level: 1,
      name: "Shifts",
    });
    expect(
      within(heading.closest("header") as HTMLElement).getByRole("button", {
        name: "Add shift",
      }),
    ).toBeDefined();
  });

  it("asks for shifts from yesterday on, and for the current week", async () => {
    mockShifts([]);

    renderPage();
    await screen.findByText("No upcoming shifts.");
    showHistory();

    expect(listShifts).toHaveBeenCalledWith({ from: "2026-10-06", limit: 500 });
    expect(listShifts).toHaveBeenCalledWith({
      from: "2026-10-05",
      to: "2026-10-11",
      limit: 500,
    });
    expect(screen.getByText("5 Oct to 11 Oct 2026")).toBeDefined();
  });

  it("puts shifts that have not ended in Upcoming and the rest in History", async () => {
    mockShifts([ended, endedOvernight, inProgress, future]);

    renderPage();

    const upcomingRows =
      await section("Upcoming shifts").findAllByRole("listitem");
    expect(upcomingRows).toHaveLength(2);
    expect(upcomingRows[0]?.textContent).toContain("Wed 7 Oct, 10:00 to 14:00");
    expect(upcomingRows[1]?.textContent).toContain("Fri 9 Oct, 09:00 to 17:00");

    showHistory();

    expect(section("Shift history").getAllByRole("listitem")).toHaveLength(2);
  });

  it("lists History with the newest shift first", async () => {
    mockShifts([ended, endedOvernight]);
    renderPage();
    await screen.findByText("No upcoming shifts.");

    showHistory();

    const rows = await section("Shift history").findAllByRole("listitem");
    expect(rows[0]?.textContent).toContain("Tue 6 Oct");
    expect(rows[1]?.textContent).toContain("Mon 5 Oct");
  });

  it("groups the shifts by week, with the week's total under the title", async () => {
    mockShifts([inProgress, future]);

    renderPage();

    expect(await screen.findByText("This week")).toBeDefined();
    expect(screen.getByText("2 shifts · 12h · €144.00")).toBeDefined();
  });

  it("shows a message in each section when there is nothing to list", async () => {
    mockShifts([]);

    renderPage();

    expect(await screen.findByText("No upcoming shifts.")).toBeDefined();
    showHistory();
    expect(screen.getByText("No finished shifts in this week.")).toBeDefined();
  });

  it("shows an error in each section when the shifts cannot be loaded", async () => {
    vi.mocked(listShifts).mockRejectedValue(new Error("network down"));

    renderPage();

    expect(await screen.findByRole("alert")).toBeDefined();
    showHistory();
    expect(await screen.findByRole("alert")).toBeDefined();
  });

  it("moves the History week back and forward, but not past the current week", async () => {
    mockShifts([]);
    renderPage();
    await screen.findByText("No upcoming shifts.");
    showHistory();
    const next = screen.getByRole("button", { name: "Next week" });
    expect((next as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Previous week" }));

    expect(await screen.findByText("28 Sep to 4 Oct 2026")).toBeDefined();
    expect(listShifts).toHaveBeenCalledWith({
      from: "2026-09-28",
      to: "2026-10-04",
      limit: 500,
    });
    expect((next as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(next);

    expect(await screen.findByText("5 Oct to 11 Oct 2026")).toBeDefined();
    expect((next as HTMLButtonElement).disabled).toBe(true);
  });

  it("switches to a week view with a column per day, and back", async () => {
    mockShifts([future]);
    renderPage();
    await screen.findByText("This week");

    fireEvent.click(screen.getByRole("button", { name: "Week" }));

    const week = await screen.findByRole("region", { name: "Week view" });
    expect(within(week).getAllByRole("heading", { level: 2 })).toHaveLength(7);
    expect(within(week).getByText("Mon 5 Oct")).toBeDefined();
    expect(within(week).getByText("Sun 11 Oct")).toBeDefined();
    expect(
      await within(week).findByRole("button", { name: `Edit ${futureLabel}` }),
    ).toBeDefined();
    expect(screen.queryByRole("button", { name: "Upcoming" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "List" }));

    expect(
      await screen.findByRole("button", { name: "Upcoming" }),
    ).toBeDefined();
  });

  it("loads the week that is shown, and the neighbouring weeks", async () => {
    mockShifts([]);
    renderPage();
    await screen.findByText("No upcoming shifts.");
    fireEvent.click(screen.getByRole("button", { name: "Week" }));
    expect(await screen.findAllByText("No shifts")).toHaveLength(7);

    fireEvent.click(screen.getByRole("button", { name: "Next week" }));

    expect(await screen.findByText("12 Oct to 18 Oct 2026")).toBeDefined();
    expect(listShifts).toHaveBeenCalledWith({
      from: "2026-10-12",
      to: "2026-10-18",
      limit: 500,
    });
  });

  it("edits a shift from the week view and fetches the week again", async () => {
    mockShifts([future]);
    vi.mocked(updateShift).mockResolvedValue(future);
    renderPage();
    await screen.findByText("This week");
    fireEvent.click(screen.getByRole("button", { name: "Week" }));
    fireEvent.click(
      await screen.findByRole("button", { name: `Edit ${futureLabel}` }),
    );
    const dialog = await screen.findByRole("dialog", { name: "Edit shift" });
    await within(dialog).findByLabelText("Job");
    const callsBefore = vi.mocked(listShifts).mock.calls.length;

    fireEvent.click(
      within(dialog).getByRole("button", { name: "Save changes" }),
    );

    await waitFor(() => expect(updateShift).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() =>
      expect(vi.mocked(listShifts).mock.calls.length).toBe(callsBefore + 3),
    );
  });

  it("opens a dialog with the shift form from the Add shift button", async () => {
    mockShifts([]);
    renderPage();
    await screen.findByText("No upcoming shifts.");

    fireEvent.click(screen.getByRole("button", { name: "Add shift" }));

    const dialog = await screen.findByRole("dialog", { name: "Add a shift" });
    expect(await within(dialog).findByLabelText("Job")).toBeDefined();
    expect(
      within(dialog).getByRole("option", { name: "Warehouse" }),
    ).toBeDefined();
  });

  it("adds a shift, closes the dialog and reloads both lists", async () => {
    mockShifts([]);
    vi.mocked(createShift).mockResolvedValue(makeShift());
    renderPage();
    await screen.findByText("No upcoming shifts.");
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
    const callsBefore = vi.mocked(listShifts).mock.calls.length;
    fireEvent.click(within(dialog).getByRole("button", { name: "Add shift" }));

    await waitFor(() =>
      expect(createShift).toHaveBeenCalledWith({
        jobId: "job-1",
        date: "2026-10-07",
        startTime: "09:00",
        endTime: "17:00",
        breakMinutes: 0,
        notes: "",
      }),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() =>
      expect(vi.mocked(listShifts).mock.calls.length).toBe(callsBefore + 2),
    );
  });

  it("explains that a job is needed when there are none", async () => {
    mockShifts([]);
    vi.mocked(listJobs).mockResolvedValue([]);
    renderPage();
    await screen.findByText("No upcoming shifts.");

    fireEvent.click(screen.getByRole("button", { name: "Add shift" }));

    const dialog = await screen.findByRole("dialog", { name: "Add a shift" });
    expect(
      await within(dialog).findByText(
        /You need a job before you can add a shift/,
      ),
    ).toBeDefined();
    expect(
      within(dialog)
        .getByRole("link", { name: "Go to Jobs" })
        .getAttribute("href"),
    ).toBe("/jobs");
  });

  it("says so when the jobs cannot be loaded", async () => {
    mockShifts([]);
    vi.mocked(listJobs).mockRejectedValue(new Error("network down"));
    renderPage();
    await screen.findByText("No upcoming shifts.");

    fireEvent.click(screen.getByRole("button", { name: "Add shift" }));

    const dialog = await screen.findByRole("dialog", { name: "Add a shift" });
    expect(
      await within(dialog).findByText(/Could not load your jobs/),
    ).toBeDefined();
  });

  it("edits a shift in a dialog and reloads both lists", async () => {
    mockShifts([future]);
    vi.mocked(updateShift).mockResolvedValue(future);
    renderPage();
    await chooseAction(futureLabel, "Edit shift");

    const dialog = await screen.findByRole("dialog", { name: "Edit shift" });
    const job = (await within(dialog).findByLabelText(
      "Job",
    )) as HTMLSelectElement;
    expect(job.value).toBe("job-1");
    expect(
      (within(dialog).getByLabelText("Date") as HTMLInputElement).value,
    ).toBe("2026-10-09");
    fireEvent.change(within(dialog).getByLabelText("Start time"), {
      target: { value: "10:00" },
    });
    const callsBefore = vi.mocked(listShifts).mock.calls.length;
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Save changes" }),
    );

    await waitFor(() =>
      expect(updateShift).toHaveBeenCalledWith("future", {
        jobId: "job-1",
        date: "2026-10-09",
        startTime: "10:00",
        endTime: "17:00",
        breakMinutes: 0,
        notes: "",
      }),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() =>
      expect(vi.mocked(listShifts).mock.calls.length).toBe(callsBefore + 2),
    );
  });

  it("keeps the edit dialog open and shows the server's error when saving fails", async () => {
    mockShifts([future]);
    vi.mocked(updateShift).mockRejectedValue(
      new ApiError(400, "Validation failed", {
        endTime: ["End time must be different from start time"],
      }),
    );
    renderPage();
    await chooseAction(futureLabel, "Edit shift");
    const dialog = await screen.findByRole("dialog", { name: "Edit shift" });

    fireEvent.click(
      await within(dialog).findByRole("button", { name: "Save changes" }),
    );

    expect(
      await within(dialog).findByText(
        "End time must be different from start time",
      ),
    ).toBeDefined();
    expect(screen.getByRole("dialog", { name: "Edit shift" })).toBeDefined();
  });

  it("asks for confirmation, naming the shift, before deleting it", async () => {
    mockShifts([future]);
    renderPage();

    await chooseAction(futureLabel, "Delete shift…");

    const dialog = screen.getByRole("dialog", { name: "Delete shift?" });
    expect(
      within(dialog).getByText(
        "This shift will be removed from your list and your totals.",
      ),
    ).toBeDefined();
    const row = within(dialog).getByRole("listitem");
    expect(row.textContent).toContain("Warehouse");
    expect(row.textContent).toContain("09:00 to 17:00");
    expect(deleteShift).not.toHaveBeenCalled();
  });

  it("deletes the shift once confirmed and reloads both lists", async () => {
    mockShifts([future]);
    vi.mocked(deleteShift).mockResolvedValue(undefined);
    renderPage();
    await chooseAction(futureLabel, "Delete shift…");
    const callsBefore = vi.mocked(listShifts).mock.calls.length;

    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Delete shift",
      }),
    );

    await waitFor(() => expect(deleteShift).toHaveBeenCalledWith("future"));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() =>
      expect(vi.mocked(listShifts).mock.calls.length).toBe(callsBefore + 2),
    );
  });

  it("keeps the shift when the delete is cancelled", async () => {
    mockShifts([future]);
    renderPage();
    await chooseAction(futureLabel, "Delete shift…");

    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Cancel",
      }),
    );

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(deleteShift).not.toHaveBeenCalled();
  });

  it("keeps the dialog open and shows the error when the delete fails", async () => {
    mockShifts([future]);
    vi.mocked(deleteShift).mockRejectedValue(
      new ApiError(404, "Shift not found"),
    );
    renderPage();
    await chooseAction(futureLabel, "Delete shift…");
    const dialog = screen.getByRole("dialog", { name: "Delete shift?" });

    fireEvent.click(
      within(dialog).getByRole("button", { name: "Delete shift" }),
    );

    expect(await within(dialog).findByText("Shift not found")).toBeDefined();
    expect(screen.getByRole("dialog", { name: "Delete shift?" })).toBeDefined();
  });

  it("confirms in a message after a shift is added, updated and deleted", async () => {
    mockShifts([future]);
    vi.mocked(createShift).mockResolvedValue(makeShift());
    vi.mocked(updateShift).mockResolvedValue(makeShift());
    vi.mocked(deleteShift).mockResolvedValue(undefined);
    renderPage();
    await screen.findByText("Warehouse");

    fireEvent.click(screen.getByRole("button", { name: "Add shift" }));
    const addDialog = await screen.findByRole("dialog", {
      name: "Add a shift",
    });
    fireEvent.change(await within(addDialog).findByLabelText("Job"), {
      target: { value: "job-1" },
    });
    fireEvent.change(within(addDialog).getByLabelText("Start time"), {
      target: { value: "09:00" },
    });
    fireEvent.change(within(addDialog).getByLabelText("End time"), {
      target: { value: "17:00" },
    });
    fireEvent.click(
      within(addDialog).getByRole("button", { name: "Add shift" }),
    );
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toBe("Shift added"),
    );

    await chooseAction(futureLabel, "Delete shift…");
    fireEvent.click(
      within(screen.getByRole("dialog", { name: "Delete shift?" })).getByRole(
        "button",
        { name: "Delete shift" },
      ),
    );
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toBe("Shift deleted"),
    );
  });

  describe("with paid leave", () => {
    const cafe: JobWithShiftCount = {
      ...warehouse,
      id: "job-2",
      name: "Cafe",
      hourlyRate: "14.00",
      vacationHoursPerYear: "80.00",
    };
    // Mon 12 to Fri 16 Oct at the Cafe, 4h a day.
    const nextWeek = makeLeave({
      id: "next-week",
      jobId: "job-2",
      job: {
        id: "job-2",
        name: "Cafe",
        hourlyRate: "14.00",
        type: "part_time",
      },
      startDate: "2026-10-12",
      endDate: "2026-10-16",
    });
    const leaveLabel = "Actions for paid leave, Cafe, 12 Oct to 16 Oct";

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    beforeEach(() => {
      vi.mocked(listJobs).mockResolvedValue([warehouse, cafe]);
      vi.mocked(listLeave).mockResolvedValue([nextWeek]);
      mockShifts([future]);
    });

    it("asks for no leave and offers no Add paid leave when no job tracks vacation", async () => {
      vi.mocked(listJobs).mockResolvedValue([warehouse]);
      renderPage();

      await screen.findByRole("button", { name: `Actions for ${futureLabel}` });
      fireEvent.click(screen.getByRole("button", { name: "Week" }));
      await screen.findByRole("button", { name: `Edit ${futureLabel}` });

      expect(listLeave).not.toHaveBeenCalled();
      expect(
        screen.queryByRole("button", { name: "Add paid leave" }),
      ).toBeNull();
    });

    it("shows a leave period in Upcoming, in the week of its start", async () => {
      renderPage();

      const trigger = await section("Upcoming shifts").findByRole("button", {
        name: leaveLabel,
      });
      const row = within(trigger.closest("li") as HTMLElement);
      expect(row.getByText("Paid leave · Cafe")).toBeDefined();
      expect(row.getByText("12 Oct to 16 Oct")).toBeDefined();
      expect(row.getByText("5 days · 20h · €280.00")).toBeDefined();
      expect(
        screen.getByRole("heading", { level: 2, name: "Next week" }),
      ).toBeDefined();
      expect(listLeave).toHaveBeenCalledWith({ from: "2026-10-07" });
    });

    it("never shows the leave of a job that stopped tracking vacation", async () => {
      vi.mocked(listLeave).mockResolvedValue([
        nextWeek,
        makeLeave({
          id: "stopped",
          startDate: "2026-10-19",
          endDate: "2026-10-23",
        }),
      ]);
      renderPage();

      await screen.findByRole("button", { name: leaveLabel });
      expect(screen.queryByText("Paid leave · Warehouse")).toBeNull();
      expect(screen.getAllByText(/^Paid leave · /)).toHaveLength(1);
    });

    it("keeps the shifts when the leave cannot be loaded", async () => {
      vi.mocked(listLeave).mockRejectedValue(new Error("down"));
      renderPage();

      expect(
        await screen.findByRole("button", {
          name: `Actions for ${futureLabel}`,
        }),
      ).toBeDefined();
      await waitFor(() => expect(listLeave).toHaveBeenCalled());
      expect(screen.queryByRole("alert")).toBeNull();
      expect(screen.queryByText(/^Paid leave · /)).toBeNull();
    });

    it("has a compact Add paid leave button next to Add shift, hidden on a phone", async () => {
      renderPage();

      const button = await screen.findByRole("button", {
        name: "Add paid leave",
      });
      const header = screen
        .getByRole("heading", { level: 1, name: "Shifts" })
        .closest("header") as HTMLElement;
      expect(header.contains(button)).toBe(true);
      expect(button.className).toContain("max-sm:hidden");
      expect(
        within(header).getByRole("button", { name: "Add shift" }),
      ).toBeDefined();

      fireEvent.click(button);
      expect(
        await screen.findByRole("dialog", { name: "Add paid leave" }),
      ).toBeDefined();
    });

    it("reloads the shifts but not the leave after a shift is deleted", async () => {
      vi.mocked(deleteShift).mockResolvedValue(undefined);
      renderPage();
      await screen.findByRole("button", { name: leaveLabel });
      await chooseAction(futureLabel, "Delete shift…");
      const shiftsBefore = vi.mocked(listShifts).mock.calls.length;
      const leaveBefore = vi.mocked(listLeave).mock.calls.length;

      fireEvent.click(
        within(screen.getByRole("dialog")).getByRole("button", {
          name: "Delete shift",
        }),
      );

      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      await waitFor(() =>
        expect(vi.mocked(listShifts).mock.calls.length).toBe(shiftsBefore + 2),
      );
      expect(vi.mocked(listLeave).mock.calls.length).toBe(leaveBefore);
    });

    it("reloads the week's shifts but not its leave after a shift is edited in the week view", async () => {
      vi.mocked(updateShift).mockResolvedValue(future);
      renderPage();
      await screen.findByRole("button", { name: `Actions for ${futureLabel}` });
      fireEvent.click(screen.getByRole("button", { name: "Week" }));
      fireEvent.click(
        await screen.findByRole("button", { name: `Edit ${futureLabel}` }),
      );
      const dialog = within(
        await screen.findByRole("dialog", { name: "Edit shift" }),
      );
      await dialog.findByLabelText("Job");
      await waitFor(() =>
        expect(listLeave).toHaveBeenCalledWith({
          from: "2026-10-05",
          to: "2026-10-11",
        }),
      );
      const shiftsBefore = vi.mocked(listShifts).mock.calls.length;
      const leaveBefore = vi.mocked(listLeave).mock.calls.length;

      fireEvent.click(dialog.getByRole("button", { name: "Save changes" }));

      await waitFor(() => expect(updateShift).toHaveBeenCalled());
      // The two lists and the week.
      await waitFor(() =>
        expect(vi.mocked(listShifts).mock.calls.length).toBe(shiftsBefore + 3),
      );
      expect(vi.mocked(listLeave).mock.calls.length).toBe(leaveBefore);
    });

    it("reloads the shifts and the leave after adding leave that removed shifts", async () => {
      vi.mocked(createLeave).mockResolvedValue({
        ...nextWeek,
        removedShifts: 1,
      });
      renderPage();
      fireEvent.click(
        await screen.findByRole("button", { name: "Add paid leave" }),
      );
      const dialog = within(
        await screen.findByRole("dialog", { name: "Add paid leave" }),
      );
      fireEvent.change(dialog.getByLabelText("From"), {
        target: { value: "2026-10-12" },
      });
      fireEvent.change(dialog.getByLabelText("To"), {
        target: { value: "2026-10-16" },
      });
      const shiftsBefore = vi.mocked(listShifts).mock.calls.length;
      const leaveBefore = vi.mocked(listLeave).mock.calls.length;

      fireEvent.click(dialog.getByRole("button", { name: "Add paid leave" }));

      await waitFor(() => expect(createLeave).toHaveBeenCalled());
      await waitFor(() => {
        expect(vi.mocked(listShifts).mock.calls.length).toBeGreaterThan(
          shiftsBefore,
        );
        expect(vi.mocked(listLeave).mock.calls.length).toBeGreaterThan(
          leaveBefore,
        );
      });
    });

    it("edits leave from its row menu with the same dialog, then reloads", async () => {
      vi.mocked(updateLeave).mockResolvedValue(nextWeek);
      renderPage();
      await chooseAction("paid leave, Cafe, 12 Oct to 16 Oct", "Edit");
      const dialog = within(
        await screen.findByRole("dialog", { name: "Edit paid leave" }),
      );
      const leaveBefore = vi.mocked(listLeave).mock.calls.length;
      const shiftsBefore = vi.mocked(listShifts).mock.calls.length;

      fireEvent.click(dialog.getByRole("button", { name: "Save changes" }));

      await waitFor(() =>
        expect(updateLeave).toHaveBeenCalledWith(
          "next-week",
          expect.anything(),
        ),
      );
      await waitFor(() => {
        expect(vi.mocked(listLeave).mock.calls.length).toBeGreaterThan(
          leaveBefore,
        );
        expect(vi.mocked(listShifts).mock.calls.length).toBeGreaterThan(
          shiftsBefore,
        );
      });
    });

    it("deletes leave after confirming, then reloads", async () => {
      vi.mocked(deleteLeave).mockResolvedValue(undefined);
      renderPage();
      await chooseAction("paid leave, Cafe, 12 Oct to 16 Oct", "Delete…");
      const dialog = within(
        await screen.findByRole("dialog", { name: "Delete paid leave?" }),
      );
      expect(dialog.getByText("12 Oct to 16 Oct")).toBeDefined();
      const leaveBefore = vi.mocked(listLeave).mock.calls.length;
      const shiftsBefore = vi.mocked(listShifts).mock.calls.length;

      vi.mocked(listLeave).mockResolvedValue([]);
      fireEvent.click(
        dialog.getByRole("button", { name: "Delete paid leave" }),
      );

      await waitFor(() =>
        expect(deleteLeave).toHaveBeenCalledWith("next-week"),
      );
      expect(await screen.findByText("Paid leave deleted")).toBeDefined();
      // Upcoming and History, their leave each.
      await waitFor(() => {
        expect(vi.mocked(listLeave).mock.calls.length).toBe(leaveBefore + 2);
        expect(vi.mocked(listShifts).mock.calls.length).toBe(shiftsBefore + 2);
      });
      await waitFor(() =>
        expect(screen.queryByRole("button", { name: leaveLabel })).toBeNull(),
      );
    });

    it("shows the leave in the week view and edits it from a block", async () => {
      vi.mocked(listLeave).mockResolvedValue([
        makeLeave({
          ...nextWeek,
          startDate: "2026-10-08",
          endDate: "2026-10-09",
        }),
      ]);
      renderPage();
      await screen.findByRole("button", { name: `Actions for ${futureLabel}` });

      fireEvent.click(screen.getByRole("button", { name: "Week" }));
      fireEvent.click(
        await screen.findByRole("button", {
          name: "Edit paid leave, Cafe, Thu 8 Oct",
        }),
      );

      expect(
        await screen.findByRole("dialog", { name: "Edit paid leave" }),
      ).toBeDefined();
      expect(listLeave).toHaveBeenCalledWith({
        from: "2026-10-05",
        to: "2026-10-11",
      });
    });

    it("deletes leave from the phone agenda", async () => {
      vi.stubGlobal("matchMedia", (query: string) => ({
        matches: query === PHONE_QUERY,
        addEventListener: () => {},
        removeEventListener: () => {},
      }));
      vi.mocked(listLeave).mockResolvedValue([
        makeLeave({
          ...nextWeek,
          startDate: "2026-10-08",
          endDate: "2026-10-08",
        }),
      ]);
      renderPage();
      await screen.findByRole("button", { name: `Actions for ${futureLabel}` });

      fireEvent.click(screen.getByRole("button", { name: "Week" }));
      await chooseAction("paid leave, Cafe, Thu 8 Oct", "Delete…");

      expect(
        await screen.findByRole("dialog", { name: "Delete paid leave?" }),
      ).toBeDefined();
    });
  });

  it("uses design tokens only, no raw palette classes", () => {
    expect(source).not.toMatch(/\b(slate|indigo|red|gray|amber|teal)-\d/);
  });
});
