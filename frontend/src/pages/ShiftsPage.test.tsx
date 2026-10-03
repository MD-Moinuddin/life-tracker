import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
import { makeShift } from "../test/fixtures";
import { ShiftsPage } from "./ShiftsPage";

vi.mock("../lib/shifts-api", () => ({
  listShifts: vi.fn(),
  createShift: vi.fn(),
  updateShift: vi.fn(),
  deleteShift: vi.fn(),
}));
vi.mock("../lib/jobs-api", () => ({ listJobs: vi.fn() }));
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
    <MemoryRouter>
      <ShiftsPage />
    </MemoryRouter>,
  );
}

function section(name: string) {
  return within(screen.getByRole("region", { name }));
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(listJobs).mockResolvedValue([warehouse]);
});

describe("ShiftsPage", () => {
  it("asks for shifts from yesterday on, and for the current week", async () => {
    mockShifts([]);

    renderPage();
    await screen.findByText("No upcoming shifts.");

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

    const upcomingRows = await section("Upcoming").findAllByRole("listitem");
    expect(upcomingRows).toHaveLength(2);
    expect(
      section("Upcoming").getByText("Wed 7 Oct, 10:00 to 14:00"),
    ).toBeDefined();
    expect(
      section("Upcoming").getByText("Fri 9 Oct, 09:00 to 17:00"),
    ).toBeDefined();
    expect(section("History").getAllByRole("listitem")).toHaveLength(2);
  });

  it("lists History with the newest shift first", async () => {
    mockShifts([ended, endedOvernight]);

    renderPage();

    const rows = await section("History").findAllByRole("listitem");
    expect(rows[0]?.textContent).toContain("Tue 6 Oct");
    expect(rows[1]?.textContent).toContain("Mon 5 Oct");
  });

  it("shows a message in each section when there is nothing to list", async () => {
    mockShifts([]);

    renderPage();

    expect(await screen.findByText("No upcoming shifts.")).toBeDefined();
    expect(screen.getByText("No finished shifts in this week.")).toBeDefined();
  });

  it("shows an error in each section when the shifts cannot be loaded", async () => {
    vi.mocked(listShifts).mockRejectedValue(new Error("network down"));

    renderPage();

    expect(await screen.findAllByRole("alert")).toHaveLength(2);
  });

  it("moves the History week back and forward, but not past the current week", async () => {
    mockShifts([]);
    renderPage();
    await screen.findByText("No upcoming shifts.");
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
    fireEvent.click(
      await screen.findByRole("button", { name: `Edit ${futureLabel}` }),
    );

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
    fireEvent.click(
      await screen.findByRole("button", { name: `Edit ${futureLabel}` }),
    );
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

    fireEvent.click(
      await screen.findByRole("button", { name: `Delete ${futureLabel}` }),
    );

    const dialog = screen.getByRole("dialog", { name: "Delete shift?" });
    expect(
      within(dialog).getByText(
        "You are about to delete the Warehouse shift on Fri 9 Oct, 09:00 to 17:00.",
      ),
    ).toBeDefined();
    expect(deleteShift).not.toHaveBeenCalled();
  });

  it("deletes the shift once confirmed and reloads both lists", async () => {
    mockShifts([future]);
    vi.mocked(deleteShift).mockResolvedValue(undefined);
    renderPage();
    fireEvent.click(
      await screen.findByRole("button", { name: `Delete ${futureLabel}` }),
    );
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
    fireEvent.click(
      await screen.findByRole("button", { name: `Delete ${futureLabel}` }),
    );

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
    fireEvent.click(
      await screen.findByRole("button", { name: `Delete ${futureLabel}` }),
    );
    const dialog = screen.getByRole("dialog", { name: "Delete shift?" });

    fireEvent.click(
      within(dialog).getByRole("button", { name: "Delete shift" }),
    );

    expect(await within(dialog).findByText("Shift not found")).toBeDefined();
    expect(screen.getByRole("dialog", { name: "Delete shift?" })).toBeDefined();
  });
});
