import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../../lib/api-client";
import { ShiftForm } from "./ShiftForm";

vi.mock("../../lib/dates", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../lib/dates")>()),
  localNow: () => "2026-10-07T12:00",
}));

const jobs = [
  { id: "job-1", name: "Warehouse", hourlyRate: "12.00" },
  { id: "job-2", name: "Cafe", hourlyRate: "10.00" },
];

function renderForm(props: Partial<ComponentProps<typeof ShiftForm>> = {}) {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  render(
    <ShiftForm
      jobs={jobs}
      submitLabel="Add shift"
      onSubmit={onSubmit}
      {...props}
    />,
  );
  return { onSubmit };
}

function fillIn(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function fillValid() {
  fillIn("Job", "job-1");
  fillIn("Start time", "09:00");
  fillIn("End time", "17:00");
}

function breakChoice(label: string) {
  return screen.getByRole("button", { name: label });
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: "Add shift" }));
}

describe("ShiftForm", () => {
  it("starts with today's date, a break of 0 and no job chosen", () => {
    renderForm();

    expect((screen.getByLabelText("Date") as HTMLInputElement).value).toBe(
      "2026-10-07",
    );
    expect(breakChoice("None").getAttribute("aria-pressed")).toBe("true");
    expect((screen.getByLabelText("Job") as HTMLSelectElement).value).toBe("");
  });

  it("preselects the job when there is only one", () => {
    renderForm({ jobs: jobs.slice(0, 1) });

    expect((screen.getByLabelText("Job") as HTMLSelectElement).value).toBe(
      "job-1",
    );
  });

  it("starts with the given values when editing", () => {
    renderForm({
      initialValues: {
        jobId: "job-2",
        date: "2026-10-03",
        startTime: "22:00",
        endTime: "02:00",
        breakMinutes: 30,
        notes: "Late",
      },
      submitLabel: "Save changes",
    });

    expect((screen.getByLabelText("Job") as HTMLSelectElement).value).toBe(
      "job-2",
    );
    expect((screen.getByLabelText("Date") as HTMLInputElement).value).toBe(
      "2026-10-03",
    );
    expect(breakChoice("30 min").getAttribute("aria-pressed")).toBe("true");
    expect(
      (screen.getByLabelText("Notes (optional)") as HTMLTextAreaElement).value,
    ).toBe("Late");
  });

  it("shows what is missing and does not submit an incomplete form", async () => {
    const { onSubmit } = renderForm();

    submit();

    const alerts = await screen.findAllByRole("alert");
    expect(alerts.map((alert) => alert.textContent)).toEqual([
      "Choose a job",
      "Enter a start time",
      "Enter an end time",
    ]);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("offers the usual breaks as quick choices, one chosen at a time", () => {
    renderForm();

    for (const label of ["None", "15 min", "30 min", "45 min", "60 min"]) {
      expect(breakChoice(label)).toBeDefined();
    }
    fireEvent.click(breakChoice("45 min"));

    expect(breakChoice("45 min").getAttribute("aria-pressed")).toBe("true");
    expect(breakChoice("None").getAttribute("aria-pressed")).toBe("false");
  });

  it("keeps an unusual break of a shift being edited as a choice of its own", () => {
    renderForm({
      initialValues: {
        jobId: "job-1",
        date: "2026-10-03",
        startTime: "09:00",
        endTime: "17:00",
        breakMinutes: 20,
        notes: "",
      },
      submitLabel: "Save changes",
    });

    expect(breakChoice("20 min").getAttribute("aria-pressed")).toBe("true");
  });

  it("rejects a break longer than the shift, with the backend's message", async () => {
    const { onSubmit } = renderForm();
    fillIn("Job", "job-1");
    fillIn("Start time", "09:00");
    fillIn("End time", "09:30");
    fireEvent.click(breakChoice("45 min"));

    submit();

    expect(
      await screen.findByText("Break cannot be longer than the shift"),
    ).toBeDefined();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects equal start and end times, with the backend's message", async () => {
    const { onSubmit } = renderForm();
    fillIn("Job", "job-1");
    fillIn("Start time", "09:00");
    fillIn("End time", "09:00");

    submit();

    expect(
      await screen.findByText("End time must be different from start time"),
    ).toBeDefined();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("moves focus to the first field with an error", () => {
    renderForm();

    submit();

    expect(document.activeElement).toBe(screen.getByLabelText("Job"));
  });

  it("shows the hours and earnings the shift will count for", () => {
    renderForm();
    expect(
      screen.getByText(
        "Choose a job and enter the times to see the hours and earnings.",
      ),
    ).toBeDefined();

    fillValid();
    fireEvent.click(breakChoice("30 min"));

    expect(screen.getByText("7h 30m worked")).toBeDefined();
    expect(screen.getByText("€90.00")).toBeDefined();
  });

  it("counts a shift that runs past midnight in the summary", () => {
    renderForm();
    fillIn("Job", "job-2");
    fillIn("Start time", "22:00");
    fillIn("End time", "02:00");

    expect(screen.getByText("4h worked")).toBeDefined();
    expect(screen.getByText("€40.00")).toBeDefined();
  });

  it("starts with the job last used, when it is still there", () => {
    localStorage.setItem("lt-last-job", "job-2");

    renderForm();

    expect((screen.getByLabelText("Job") as HTMLSelectElement).value).toBe(
      "job-2",
    );
  });

  it("ignores a last-used job that no longer exists", () => {
    localStorage.setItem("lt-last-job", "gone");

    renderForm();

    expect((screen.getByLabelText("Job") as HTMLSelectElement).value).toBe("");
  });

  it("remembers the job after a new shift is saved, but not after an edit", async () => {
    const { onSubmit } = renderForm();
    fillValid();
    submit();
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(localStorage.getItem("lt-last-job")).toBe("job-1");

    localStorage.clear();
    cleanup();
    renderForm({
      initialValues: {
        jobId: "job-2",
        date: "2026-10-03",
        startTime: "09:00",
        endTime: "17:00",
        breakMinutes: 0,
        notes: "",
      },
      submitLabel: "Save changes",
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(screen.queryByText("Saving…")).toBeNull());
    expect(localStorage.getItem("lt-last-job")).toBeNull();
  });

  it("submits the values the API expects", async () => {
    const { onSubmit } = renderForm();

    fillValid();
    fillIn("Date", "2026-10-09");
    fireEvent.click(breakChoice("30 min"));
    fillIn("Notes (optional)", "  Early start  ");
    submit();

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        jobId: "job-1",
        date: "2026-10-09",
        startTime: "09:00",
        endTime: "17:00",
        breakMinutes: 30,
        notes: "Early start",
      }),
    );
  });

  it("tells the user when a shift ends the next day", () => {
    renderForm();

    fillIn("Start time", "22:00");
    fillIn("End time", "06:00");

    expect(screen.getByText("This shift ends the next day.")).toBeDefined();
  });

  it("shows no overnight hint for a same-day shift", () => {
    renderForm();

    fillIn("Start time", "09:00");
    fillIn("End time", "17:00");

    expect(screen.queryByText("This shift ends the next day.")).toBeNull();
  });

  it("shows the server's field errors next to the matching field", async () => {
    const onSubmit = vi.fn().mockRejectedValue(
      new ApiError(400, "Validation failed", {
        endTime: ["End time must be different from start time"],
      }),
    );
    renderForm({ onSubmit });

    fillValid();
    submit();

    const message = await screen.findByText(
      "End time must be different from start time",
    );
    const input = screen.getByLabelText("End time");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBe(
      message.parentElement?.id,
    );
  });

  it("shows an error that belongs to no field at the top of the form", async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValue(new ApiError(404, "Job not found"));
    renderForm({ onSubmit });

    fillValid();
    submit();

    expect(await screen.findByText("Job not found")).toBeDefined();
  });

  it("disables the form while saving", async () => {
    let finish: () => void = () => {};
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    renderForm({ onSubmit });

    fillValid();
    submit();

    await screen.findByText("Saving…");
    expect((screen.getByLabelText("Date") as HTMLInputElement).disabled).toBe(
      true,
    );

    finish();
    await waitFor(() => expect(screen.queryByText("Saving…")).toBeNull());
  });

  it("calls onCancel when Cancel is pressed", () => {
    const onCancel = vi.fn();
    renderForm({ onCancel });

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("uses the shared controls and no raw palette colours", () => {
    renderForm();

    for (const label of [
      "Job",
      "Date",
      "Start time",
      "End time",
      "Notes (optional)",
    ]) {
      expect(screen.getByLabelText(label).className).toContain(
        "rounded-control",
      );
    }
    expect(document.body.innerHTML).not.toMatch(/slate-|indigo-|red-/);
  });

  it("shows the no-field error in the shared danger alert", async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValue(new ApiError(404, "Job not found"));
    renderForm({ onSubmit });

    fillValid();
    submit();

    const message = await screen.findByText("Job not found");
    expect(message.closest('[role="alert"]')?.className).toContain(
      "bg-danger-soft",
    );
  });
});
