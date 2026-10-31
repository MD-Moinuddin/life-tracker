import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type { ComponentProps } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../lib/api-client";
import type { JobWithShiftCount } from "../../lib/jobs-api";
import { createLeave, listLeave, updateLeave } from "../../lib/leave-api";
import type { Leave } from "../../lib/leave-api";
import { listShifts } from "../../lib/shifts-api";
import { makeShift, noVacation } from "../../test/fixtures";
import { ToastProvider } from "../ui/ToastProvider";
import { AddLeaveDialog } from "./AddLeaveDialog";

vi.mock("../../lib/leave-api", () => ({
  listLeave: vi.fn(),
  createLeave: vi.fn(),
  updateLeave: vi.fn(),
}));
vi.mock("../../lib/shifts-api", () => ({ listShifts: vi.fn() }));

const cafe: JobWithShiftCount = {
  id: "job-1",
  name: "Cafe",
  hourlyRate: "14.00",
  type: "part_time",
  vacationHoursPerYear: "80.00",
  vacationCarryOverHours: "0.00",
  vacationCarryOverYear: null,
  createdAt: "2026-10-01T09:00:00.000Z",
  updatedAt: "2026-10-01T09:00:00.000Z",
  shiftCount: 2,
};
const bar: JobWithShiftCount = { ...cafe, id: "job-2", name: "Bar" };
const warehouse: JobWithShiftCount = {
  ...cafe,
  id: "job-3",
  name: "Warehouse",
  ...noVacation,
};

const saved: Leave = {
  id: "leave-1",
  jobId: "job-1",
  job: { id: "job-1", name: "Cafe", hourlyRate: "14.00", type: "part_time" },
  type: "paid_vacation",
  startDate: "2026-12-21",
  endDate: "2026-12-23",
  weekdays: [1, 2, 3, 4, 5],
  minutesPerDay: 240,
  notes: null,
  createdAt: "2026-10-01T09:00:00.000Z",
  updatedAt: "2026-10-01T09:00:00.000Z",
};

function shiftPage(items = [] as ReturnType<typeof makeShift>[]) {
  return { items, total: items.length, limit: 500, offset: 0 };
}

function renderDialog(
  props: Partial<ComponentProps<typeof AddLeaveDialog>> = {},
) {
  const onClose = vi.fn();
  const onSaved = vi.fn();
  render(
    <ToastProvider>
      <MemoryRouter>
        <AddLeaveDialog
          open
          jobs={[cafe, warehouse]}
          today="2026-10-31"
          onClose={onClose}
          onSaved={onSaved}
          {...props}
        />
      </MemoryRouter>
    </ToastProvider>,
  );
  return { onClose, onSaved };
}

function dialog(name = "Add paid leave") {
  return within(screen.getByRole("dialog", { name }));
}

function fillIn(label: string, value: string) {
  fireEvent.change(dialog().getByLabelText(label), { target: { value } });
}

function pickChristmasWeek() {
  fillIn("From", "2026-12-21");
  fillIn("To", "2026-12-23");
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(listLeave).mockResolvedValue([]);
  vi.mocked(listShifts).mockResolvedValue(shiftPage());
});

afterEach(() => {
  vi.useRealTimers();
});

describe("AddLeaveDialog", () => {
  it("opens with the given job chosen, offering only the jobs that track vacation", () => {
    renderDialog({ jobs: [cafe, warehouse, bar], defaultJobId: "job-2" });

    const job = dialog().getByLabelText("Job") as HTMLSelectElement;
    expect(job.value).toBe("job-2");
    expect([...job.options].map((option) => option.textContent)).toEqual([
      "Choose a job",
      "Cafe",
      "Bar",
    ]);
  });

  it("loads the year's leave for the balance, once", async () => {
    vi.mocked(listLeave).mockResolvedValue([
      { ...saved, startDate: "2026-08-03", endDate: "2026-08-07" },
    ]);
    renderDialog();
    pickChristmasWeek();

    expect(
      await dialog().findByText("3 days · 12h · leaves 48h of 80h"),
    ).toBeDefined();
    expect(listLeave).toHaveBeenCalledTimes(1);
    expect(listLeave).toHaveBeenCalledWith({
      from: "2026-01-01",
      to: "2026-12-31",
    });
  });

  it("warns about the shifts on the picked days, loaded for the job and the dates", async () => {
    vi.mocked(listShifts).mockResolvedValue(
      shiftPage([makeShift({ jobId: "job-1", date: "2026-12-22" })]),
    );
    renderDialog();
    pickChristmasWeek();

    expect(
      await dialog().findByText("You have 1 shift on these days (Tue 22 Dec)."),
    ).toBeDefined();
    await waitFor(() =>
      expect(listShifts).toHaveBeenLastCalledWith({
        from: "2026-12-21",
        to: "2026-12-23",
        jobId: "job-1",
        limit: 500,
      }),
    );
  });

  it("asks for the shifts once a burst of changes settles, not on every change", async () => {
    vi.useFakeTimers();
    renderDialog({ jobs: [cafe, bar] });
    await act(async () => {});
    // No job is chosen yet (two jobs, no default), so nothing is asked on open.
    expect(listShifts).toHaveBeenCalledTimes(0);

    fillIn("Job", "job-1");
    await act(async () => {});
    expect(listShifts).toHaveBeenCalledTimes(0);
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    expect(listShifts).toHaveBeenCalledTimes(1);

    fillIn("From", "2026-12-01");
    fillIn("From", "2026-12-14");
    fillIn("To", "2026-12-20");
    fireEvent.click(dialog().getByRole("button", { name: "Sat" }));
    fireEvent.click(dialog().getByRole("button", { name: "8h" }));
    fillIn("To", "2026-12-23");
    await act(async () => {
      vi.advanceTimersByTime(299);
    });
    expect(listShifts).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(listShifts).toHaveBeenCalledTimes(2);
    expect(listShifts).toHaveBeenLastCalledWith({
      from: "2026-12-14",
      to: "2026-12-23",
      jobId: "job-1",
      limit: 500,
    });
    expect(listLeave).toHaveBeenCalledTimes(1);
  });

  it("never shows what is left from another year's leave while From crosses a year", async () => {
    vi.useFakeTimers();
    vi.mocked(listLeave).mockImplementation(async ({ from } = {}) =>
      from === "2027-01-01"
        ? // 8 hours in 2027: Monday 1 and Tuesday 2 February.
          [
            {
              ...saved,
              id: "leave-2027",
              startDate: "2027-02-01",
              endDate: "2027-02-02",
            },
          ]
        : // 20 hours in 2026: 3 to 7 August.
          [{ ...saved, startDate: "2026-08-03", endDate: "2026-08-07" }],
    );
    renderDialog();
    fillIn("From", "2026-12-21");
    fillIn("To", "2026-12-23");
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    expect(
      dialog().getByText("3 days · 12h · leaves 48h of 80h"),
    ).toBeDefined();

    // Monday 4 to Wednesday 6 January 2027.
    fillIn("From", "2027-01-04");
    fillIn("To", "2027-01-06");
    await act(async () => {});
    expect(dialog().getByText("3 days · 12h")).toBeDefined();
    expect(dialog().queryByText(/leaves/)).toBeNull();

    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    expect(
      dialog().getByText("3 days · 12h · leaves 60h of 80h"),
    ).toBeDefined();
    expect(listLeave).toHaveBeenLastCalledWith({
      from: "2027-01-01",
      to: "2027-12-31",
    });
  });

  it("keeps the last bookable year when a date is cleared, asking for no other year", async () => {
    vi.useFakeTimers();
    renderDialog();
    await act(async () => {});
    fillIn("From", "2027-01-04");
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    expect(listLeave).toHaveBeenCalledTimes(2);
    expect(listLeave).toHaveBeenLastCalledWith({
      from: "2027-01-01",
      to: "2027-12-31",
    });

    fillIn("From", "");
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(listLeave).toHaveBeenCalledTimes(2);
  });

  it("asks for nothing more while the dates cannot be booked", async () => {
    vi.useFakeTimers();
    renderDialog();
    await act(async () => {});
    expect(listShifts).toHaveBeenCalledTimes(1);

    fillIn("From", "2026-12-28");
    fillIn("To", "2027-01-04");
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(listShifts).toHaveBeenCalledTimes(1);
  });

  it("books the leave, closes and confirms in a message", async () => {
    vi.mocked(createLeave).mockResolvedValue(saved);
    const { onClose, onSaved } = renderDialog();
    pickChristmasWeek();

    fireEvent.click(dialog().getByRole("button", { name: "Add paid leave" }));

    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toBe("Paid leave added"),
    );
    expect(createLeave).toHaveBeenCalledWith({
      jobId: "job-1",
      startDate: "2026-12-21",
      endDate: "2026-12-23",
      weekdays: [1, 2, 3, 4, 5],
      minutesPerDay: 240,
      notes: "",
    });
    expect(onSaved).toHaveBeenCalledWith(saved);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("says how many shifts were removed", async () => {
    vi.mocked(listShifts).mockResolvedValue(
      shiftPage([
        makeShift({ id: "s1", jobId: "job-1", date: "2026-12-22" }),
        makeShift({ id: "s2", jobId: "job-1", date: "2026-12-23" }),
      ]),
    );
    vi.mocked(createLeave).mockResolvedValue({ ...saved, removedShifts: 2 });
    renderDialog();
    pickChristmasWeek();

    fireEvent.click(
      await dialog().findByRole("checkbox", {
        name: "Remove them when I add this leave",
      }),
    );
    fireEvent.click(dialog().getByRole("button", { name: "Add paid leave" }));

    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toBe(
        "Paid leave added · 2 shifts removed",
      ),
    );
    expect(createLeave).toHaveBeenCalledWith(
      expect.objectContaining({ removeOverlappingShifts: true }),
    );
  });

  it("edits an entry and confirms the update", async () => {
    vi.mocked(updateLeave).mockResolvedValue(saved);
    const { onClose, onSaved } = renderDialog({ editing: saved });

    fireEvent.click(
      dialog("Edit paid leave").getByRole("button", { name: "8h" }),
    );
    fireEvent.click(
      dialog("Edit paid leave").getByRole("button", { name: "Save changes" }),
    );

    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toBe("Paid leave updated"),
    );
    expect(updateLeave).toHaveBeenCalledWith("leave-1", {
      jobId: "job-1",
      startDate: "2026-12-21",
      endDate: "2026-12-23",
      weekdays: [1, 2, 3, 4, 5],
      minutesPerDay: 480,
      notes: "",
    });
    expect(createLeave).not.toHaveBeenCalled();
    expect(onSaved).toHaveBeenCalledWith(saved);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("stays open and shows the server's error", async () => {
    vi.mocked(createLeave).mockRejectedValue(
      new ApiError(400, "Validation failed", {
        startDate: ["These days already have paid leave"],
      }),
    );
    const { onClose, onSaved } = renderDialog();
    pickChristmasWeek();

    fireEvent.click(dialog().getByRole("button", { name: "Add paid leave" }));

    expect(
      await dialog().findByText("These days already have paid leave"),
    ).toBeDefined();
    expect(onSaved).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("still books when the year's leave cannot be loaded", async () => {
    vi.mocked(listLeave).mockRejectedValue(new Error("network down"));
    vi.mocked(createLeave).mockResolvedValue(saved);
    renderDialog();
    pickChristmasWeek();

    await waitFor(() => expect(listLeave).toHaveBeenCalled());
    expect(dialog().getByText("3 days · 12h")).toBeDefined();

    fireEvent.click(dialog().getByRole("button", { name: "Add paid leave" }));
    await waitFor(() => expect(createLeave).toHaveBeenCalledTimes(1));
  });

  it("asks to turn on paid vacation first when no job tracks it", () => {
    const { onClose } = renderDialog({ jobs: [warehouse] });

    expect(
      dialog().getByText("Turn on paid vacation for a job first."),
    ).toBeDefined();
    expect(
      dialog().getByRole("link", { name: "Go to Jobs" }).getAttribute("href"),
    ).toBe("/jobs");
    expect(listLeave).not.toHaveBeenCalled();
    expect(listShifts).not.toHaveBeenCalled();

    // The notice's own Close button, after the dialog's corner one.
    const [, close] = dialog().getAllByRole("button", { name: "Close" });
    fireEvent.click(close as HTMLElement);
    expect(onClose).toHaveBeenCalled();
  });

  it("makes no request while closed", () => {
    renderDialog({ open: false });

    expect(listLeave).not.toHaveBeenCalled();
    expect(listShifts).not.toHaveBeenCalled();
  });
});
