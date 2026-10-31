import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../../lib/api-client";
import type { JobWithShiftCount } from "../../lib/jobs-api";
import type { Leave } from "../../lib/leave-api";
import { makeShift } from "../../test/fixtures";
import { LeaveForm } from "./LeaveForm";
import source from "./LeaveForm.tsx?raw";

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
  shiftCount: 0,
};
const bar: JobWithShiftCount = {
  ...cafe,
  id: "job-2",
  name: "Bar",
  hourlyRate: "12.00",
  vacationHoursPerYear: "40.00",
};

function leave(overrides: Partial<Leave> = {}): Leave {
  return {
    id: "leave-1",
    jobId: "job-1",
    job: { id: "job-1", name: "Cafe", hourlyRate: "14.00", type: "part_time" },
    type: "paid_vacation",
    startDate: "2026-08-03",
    endDate: "2026-08-07",
    weekdays: [1, 2, 3, 4, 5],
    minutesPerDay: 240,
    notes: null,
    createdAt: "2026-10-01T09:00:00.000Z",
    updatedAt: "2026-10-01T09:00:00.000Z",
    ...overrides,
  };
}

function renderForm(props: Partial<ComponentProps<typeof LeaveForm>> = {}) {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const onCancel = vi.fn();
  const view = render(
    <LeaveForm
      jobs={[cafe]}
      existingLeave={[]}
      shiftsInRange={[]}
      today="2026-10-31"
      onSubmit={onSubmit}
      onCancel={onCancel}
      {...props}
    />,
  );
  return { onSubmit, onCancel, ...view };
}

function input(label: string) {
  return screen.getByLabelText(label) as HTMLInputElement;
}

function fillIn(label: string, value: string) {
  fireEvent.change(input(label), { target: { value } });
}

function leaveField(label: string) {
  fireEvent.blur(input(label));
}

function chip(name: string) {
  return screen.getByRole("button", { name });
}

function pressed(name: string) {
  return chip(name).getAttribute("aria-pressed");
}

// Monday 21 to Wednesday 23 December: three weekdays.
function pickChristmasWeek() {
  fillIn("From", "2026-12-21");
  fillIn("To", "2026-12-23");
}

function submit(label = "Add paid leave") {
  fireEvent.click(screen.getByRole("button", { name: label }));
}

describe("LeaveForm", () => {
  it("starts with today, Monday to Friday and 4 hours per day", () => {
    renderForm();

    expect(input("From").value).toBe("2026-10-31");
    expect(input("To").value).toBe("2026-10-31");
    for (const day of ["Mon", "Tue", "Wed", "Thu", "Fri"]) {
      expect(pressed(day)).toBe("true");
    }
    expect(pressed("Sat")).toBe("false");
    expect(pressed("Sun")).toBe("false");
    expect(pressed("4h")).toBe("true");
    expect(
      screen
        .getAllByRole("button", { pressed: true })
        .map((button) => button.textContent),
    ).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri", "4h"]);
  });

  it("offers the days Monday to Sunday and the usual hours per day", () => {
    renderForm();

    const days = screen.getByRole("group", { name: "Days that count" });
    expect(
      [...days.querySelectorAll("button")].map((day) => day.textContent),
    ).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
    const hours = screen.getByRole("group", { name: "Hours per day" });
    expect(
      [...hours.querySelectorAll("button")].map((hour) => hour.textContent),
    ).toEqual(["Half day (2h)", "4h", "5h", "6h", "8h"]);
  });

  it("preselects the only job, or the given one", () => {
    renderForm();
    expect((screen.getByLabelText("Job") as HTMLSelectElement).value).toBe(
      "job-1",
    );
  });

  it("preselects the given job when there are several, and none otherwise", () => {
    const { unmount } = renderForm({
      jobs: [cafe, bar],
      defaultJobId: "job-2",
    });
    expect((screen.getByLabelText("Job") as HTMLSelectElement).value).toBe(
      "job-2",
    );
    unmount();

    renderForm({ jobs: [cafe, bar] });
    expect((screen.getByLabelText("Job") as HTMLSelectElement).value).toBe("");
  });

  it("shows the days, hours, what is left and the pay as the leave is picked", () => {
    renderForm();

    pickChristmasWeek();

    expect(screen.getByText("3 days · 12h · leaves 68h of 80h")).toBeDefined();
    expect(screen.getByText("€168.00")).toBeDefined();
  });

  it("counts the job's other leave in that year, but not the entry being edited", () => {
    const august = leave();
    const otherJob = leave({ id: "leave-2", jobId: "job-2" });
    const lastYear = leave({
      id: "leave-3",
      startDate: "2025-08-04",
      endDate: "2025-08-08",
    });
    const { unmount } = renderForm({
      existingLeave: [august, otherJob, lastYear],
    });
    pickChristmasWeek();
    expect(screen.getByText("3 days · 12h · leaves 48h of 80h")).toBeDefined();
    unmount();

    renderForm({
      initialValues: leave({
        id: "leave-9",
        startDate: "2026-12-21",
        endDate: "2026-12-23",
      }),
      existingLeave: [
        august,
        leave({
          id: "leave-9",
          startDate: "2026-12-21",
          endDate: "2026-12-23",
        }),
      ],
    });
    expect(screen.getByText("3 days · 12h · leaves 48h of 80h")).toBeDefined();
  });

  it("adds the carry-over of the booking year to the allowance", () => {
    renderForm({
      jobs: [
        {
          ...cafe,
          vacationCarryOverHours: "8.00",
          vacationCarryOverYear: 2026,
        },
      ],
    });

    pickChristmasWeek();

    expect(screen.getByText("3 days · 12h · leaves 76h of 88h")).toBeDefined();
  });

  it("shows only the leave's own hours while the year's balance is unknown", () => {
    renderForm({ existingLeave: undefined });

    pickChristmasWeek();

    expect(screen.getByText("3 days · 12h")).toBeDefined();
    expect(screen.getByText("€168.00")).toBeDefined();
  });

  it("toggles the days that count and picks the hours per day", () => {
    renderForm();
    pickChristmasWeek();

    fireEvent.click(chip("Wed"));
    expect(pressed("Wed")).toBe("false");
    expect(screen.getByText("2 days · 8h · leaves 72h of 80h")).toBeDefined();

    fireEvent.click(chip("8h"));
    expect(pressed("8h")).toBe("true");
    expect(pressed("4h")).toBe("false");
    expect(screen.getByText("2 days · 16h · leaves 64h of 80h")).toBeDefined();

    fireEvent.click(chip("Half day (2h)"));
    expect(screen.getByText("2 days · 4h · leaves 76h of 80h")).toBeDefined();
    expect(screen.getByText("€56.00")).toBeDefined();

    fireEvent.click(chip("Wed"));
    expect(pressed("Wed")).toBe("true");
    expect(screen.getByText("3 days · 6h · leaves 74h of 80h")).toBeDefined();
  });

  it("never lets the end come before the start", () => {
    renderForm();
    fillIn("From", "2026-12-21");

    expect(input("To").min).toBe("2026-12-21");
    expect(input("To").value).toBe("2026-12-21");

    fillIn("To", "2026-12-24");
    fillIn("From", "2026-12-22");
    expect(input("To").value).toBe("2026-12-24");
  });

  it("says when an end typed before the start is left", () => {
    renderForm();
    fillIn("From", "2026-12-21");
    fillIn("To", "2026-12-18");

    expect(
      screen.queryByText("End date must not be before the start date"),
    ).toBeNull();
    leaveField("To");

    expect(
      screen.getByText("End date must not be before the start date"),
    ).toBeDefined();
    expect(input("To").getAttribute("aria-invalid")).toBe("true");
  });

  it("asks for one entry per year when the dates span two", () => {
    const { onSubmit } = renderForm();
    fillIn("From", "2026-12-28");
    fillIn("To", "2027-01-04");
    leaveField("To");

    const message =
      "Paid leave cannot span two calendar years. Add one entry for each year.";
    expect(screen.getByText(message)).toBeDefined();

    submit();
    expect(onSubmit).not.toHaveBeenCalled();

    fillIn("To", "2026-12-31");
    expect(screen.queryByText(message)).toBeNull();
  });

  it("shows a hint when no day counts, and says why on submit", () => {
    const { onSubmit } = renderForm();
    // Saturday 31 October, with Monday to Friday picked.
    expect(
      screen.getByText(
        "Pick the dates and the days that count to see the hours and pay.",
      ),
    ).toBeDefined();

    submit();

    expect(
      screen.getByText("None of the selected days fall between these dates"),
    ).toBeDefined();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(
      (
        screen.getByRole("button", {
          name: "Add paid leave",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false);

    fireEvent.click(chip("Sat"));
    expect(
      screen.queryByText("None of the selected days fall between these dates"),
    ).toBeNull();
  });

  it("asks for at least one day of the week", () => {
    const { onSubmit } = renderForm();
    pickChristmasWeek();
    for (const day of ["Mon", "Tue", "Wed", "Thu", "Fri"]) {
      fireEvent.click(chip(day));
    }

    submit();

    expect(screen.getByText("Pick at least one day of the week")).toBeDefined();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("moves focus to the first problem on submit", () => {
    renderForm({ jobs: [cafe, bar] });
    pickChristmasWeek();

    submit();

    expect(screen.getByRole("alert").textContent).toBe("Choose a job");
    expect(document.activeElement).toBe(screen.getByLabelText("Job"));
  });

  it("warns when the leave is more than what is left, and still books it", async () => {
    // 76 of the 80 hours are already booked: 19 days of 4 hours.
    const { onSubmit } = renderForm({
      existingLeave: [
        leave({ startDate: "2026-03-02", endDate: "2026-03-26" }),
      ],
    });
    pickChristmasWeek();

    expect(screen.getByText("3 days · 12h · leaves −8h of 80h")).toBeDefined();
    expect(screen.getByRole("alert").textContent).toBe(
      "This is 8h more than you have left this year. You can still book it.",
    );

    submit();
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  });

  it("does not warn while the leave fits", () => {
    renderForm();
    pickChristmasWeek();

    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("warns about the job's shifts on the counted days and can remove them", async () => {
    const shifts = [
      makeShift({ id: "s1", jobId: "job-1", date: "2026-12-22" }),
      makeShift({ id: "s2", jobId: "job-1", date: "2026-12-23" }),
      // Another job, and a day that does not count: no warning for these.
      makeShift({ id: "s3", jobId: "job-2", date: "2026-12-21" }),
      makeShift({ id: "s4", jobId: "job-1", date: "2026-12-26" }),
    ];
    const { onSubmit } = renderForm({ shiftsInRange: shifts });
    fillIn("From", "2026-12-21");
    fillIn("To", "2026-12-26");

    expect(
      screen.getByText(
        "You have 2 shifts on these days (Tue 22 and Wed 23 Dec).",
      ),
    ).toBeDefined();
    const remove = screen.getByRole("checkbox", {
      name: "Remove them when I add this leave",
    }) as HTMLInputElement;
    expect(remove.checked).toBe(false);

    fireEvent.click(remove);
    submit();

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        jobId: "job-1",
        startDate: "2026-12-21",
        endDate: "2026-12-26",
        weekdays: [1, 2, 3, 4, 5],
        minutesPerDay: 240,
        notes: "",
        removeOverlappingShifts: true,
      }),
    );
  });

  it("unticks the removal when the clashing shifts change", async () => {
    const { onSubmit } = renderForm({
      shiftsInRange: [
        makeShift({ id: "s1", jobId: "job-1", date: "2026-12-22" }),
        makeShift({ id: "s2", jobId: "job-1", date: "2026-12-29" }),
      ],
    });
    pickChristmasWeek();
    fireEvent.click(
      screen.getByRole("checkbox", { name: "Remove it when I add this leave" }),
    );

    // Monday 28 to Wednesday 30 December: a different shift clashes.
    fillIn("From", "2026-12-28");
    fillIn("To", "2026-12-30");

    const remove = screen.getByRole("checkbox", {
      name: "Remove it when I add this leave",
    }) as HTMLInputElement;
    expect(remove.checked).toBe(false);
    submit();
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]?.[0]).not.toHaveProperty(
      "removeOverlappingShifts",
    );
  });

  it("gives each chip one padding, and shows focus on the days when it moves there", () => {
    renderForm();

    for (const name of ["Mon", "4h"]) {
      const paddings = chip(name)
        .className.split(" ")
        .filter((name) => /^px-/.test(name));
      expect(paddings).toHaveLength(1);
    }
    const days = screen.getByRole("group", { name: "Days that count" });
    expect(days.className).not.toContain("outline-none");
  });

  it("names one shift in the singular", () => {
    renderForm({
      shiftsInRange: [makeShift({ jobId: "job-1", date: "2026-12-22" })],
    });
    pickChristmasWeek();

    expect(
      screen.getByText("You have 1 shift on these days (Tue 22 Dec)."),
    ).toBeDefined();
    expect(
      screen.getByRole("checkbox", { name: "Remove it when I add this leave" }),
    ).toBeDefined();
  });

  it("keeps the shifts unless the box is ticked", async () => {
    const { onSubmit } = renderForm({
      shiftsInRange: [makeShift({ jobId: "job-1", date: "2026-12-22" })],
    });
    pickChristmasWeek();

    submit();

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]?.[0]).not.toHaveProperty(
      "removeOverlappingShifts",
    );
  });

  it("sends the leave as picked", async () => {
    const { onSubmit } = renderForm({ jobs: [cafe, bar] });
    fireEvent.change(screen.getByLabelText("Job"), {
      target: { value: "job-2" },
    });
    pickChristmasWeek();
    fireEvent.click(chip("Sun"));
    fireEvent.click(chip("6h"));
    fireEvent.change(screen.getByLabelText("Notes (optional)"), {
      target: { value: "  Christmas  " },
    });

    submit();

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        jobId: "job-2",
        startDate: "2026-12-21",
        endDate: "2026-12-23",
        weekdays: [0, 1, 2, 3, 4, 5],
        minutesPerDay: 360,
        notes: "Christmas",
      }),
    );
  });

  it("starts with the entry's values when editing, keeps an unusual length as its own choice and offers no removal", async () => {
    const editing = leave({
      startDate: "2026-12-21",
      endDate: "2026-12-23",
      weekdays: [1, 3],
      minutesPerDay: 450,
      notes: "Family",
    });
    const { onSubmit } = renderForm({
      initialValues: editing,
      shiftsInRange: [makeShift({ jobId: "job-1", date: "2026-12-23" })],
    });

    expect(input("From").value).toBe("2026-12-21");
    expect(input("To").value).toBe("2026-12-23");
    expect(pressed("Mon")).toBe("true");
    expect(pressed("Tue")).toBe("false");
    expect(pressed("Wed")).toBe("true");
    expect(pressed("7h 30m")).toBe("true");
    expect(
      (screen.getByLabelText("Notes (optional)") as HTMLTextAreaElement).value,
    ).toBe("Family");
    expect(
      screen.getByText("You have 1 shift on these days (Wed 23 Dec)."),
    ).toBeDefined();
    expect(screen.queryByRole("checkbox")).toBeNull();

    submit("Save changes");

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        jobId: "job-1",
        startDate: "2026-12-21",
        endDate: "2026-12-23",
        weekdays: [1, 3],
        minutesPerDay: 450,
        notes: "Family",
      }),
    );
  });

  it("shows the server's overlap error next to From", async () => {
    const onSubmit = vi.fn().mockRejectedValue(
      new ApiError(400, "Validation failed", {
        startDate: ["These days already have paid leave"],
      }),
    );
    renderForm({ onSubmit });
    pickChristmasWeek();

    submit();

    expect(
      await screen.findByText("These days already have paid leave"),
    ).toBeDefined();
    expect(input("From").getAttribute("aria-invalid")).toBe("true");
  });

  it("shows a form-level server error at the top", async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValue(
        new ApiError(400, "Turn on paid vacation for this job first"),
      );
    renderForm({ onSubmit });
    pickChristmasWeek();

    submit();

    expect(
      await screen.findByText("Turn on paid vacation for this job first"),
    ).toBeDefined();
  });

  it("reports the job and dates so the shifts on them can be loaded", () => {
    const onRangeChange = vi.fn();
    renderForm({ onRangeChange });

    expect(onRangeChange).toHaveBeenLastCalledWith({
      jobId: "job-1",
      startDate: "2026-10-31",
      endDate: "2026-10-31",
    });

    fillIn("To", "2026-11-06");
    expect(onRangeChange).toHaveBeenLastCalledWith({
      jobId: "job-1",
      startDate: "2026-10-31",
      endDate: "2026-11-06",
    });

    const calls = onRangeChange.mock.calls.length;
    fireEvent.click(chip("Sat"));
    fireEvent.click(chip("8h"));
    expect(onRangeChange).toHaveBeenCalledTimes(calls);
  });

  it("cancels", () => {
    const { onCancel } = renderForm();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("uses design tokens only, no raw palette classes", () => {
    expect(source).not.toMatch(/\b(slate|indigo|red|gray|amber|teal)-\d/);
  });
});
