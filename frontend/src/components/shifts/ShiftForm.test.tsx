import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../../lib/api-client";
import { ShiftForm } from "./ShiftForm";

vi.mock("../../lib/dates", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../lib/dates")>()),
  localNow: () => "2026-10-07T12:00",
}));

const jobs = [
  { id: "job-1", name: "Warehouse" },
  { id: "job-2", name: "Cafe" },
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

function submit() {
  fireEvent.click(screen.getByRole("button", { name: "Add shift" }));
}

describe("ShiftForm", () => {
  it("starts with today's date, a break of 0 and no job chosen", () => {
    renderForm();

    expect((screen.getByLabelText("Date") as HTMLInputElement).value).toBe(
      "2026-10-07",
    );
    expect(
      (screen.getByLabelText("Break (minutes)") as HTMLInputElement).value,
    ).toBe("0");
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
    expect(
      (screen.getByLabelText("Break (minutes)") as HTMLInputElement).value,
    ).toBe("30");
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

  it("rejects a break that is not a whole number", async () => {
    const { onSubmit } = renderForm();

    fillValid();
    fillIn("Break (minutes)", "1.5");
    submit();

    expect(
      await screen.findByText(
        "Enter the break in whole minutes, or 0 for none",
      ),
    ).toBeDefined();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits the values the API expects", async () => {
    const { onSubmit } = renderForm();

    fillValid();
    fillIn("Date", "2026-10-09");
    fillIn("Break (minutes)", "30");
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
});
