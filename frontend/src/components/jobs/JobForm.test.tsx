import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../../lib/api-client";
import { JobForm } from "./JobForm";

vi.mock("../../lib/dates", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../lib/dates")>()),
  localNow: () => "2026-10-07T12:00",
}));

function renderForm(props: Partial<ComponentProps<typeof JobForm>> = {}) {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  render(<JobForm submitLabel="Add job" onSubmit={onSubmit} {...props} />);
  return { onSubmit };
}

function fillIn(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function submit(label = "Add job") {
  fireEvent.click(screen.getByRole("button", { name: label }));
}

function fillValid() {
  fillIn("Name", "Cafe");
  fillIn("Hourly rate", "10");
}

describe("JobForm", () => {
  it("starts with the given values when editing", () => {
    renderForm({
      initialValues: {
        name: "Warehouse",
        hourlyRate: "12.00",
        type: "mini_job",
      },
      submitLabel: "Save changes",
    });

    expect((screen.getByLabelText("Name") as HTMLInputElement).value).toBe(
      "Warehouse",
    );
    expect(
      (screen.getByLabelText("Hourly rate") as HTMLInputElement).value,
    ).toBe("12.00");
    expect(
      (screen.getByRole("radio", { name: /Mini-job/ }) as HTMLInputElement)
        .checked,
    ).toBe(true);
    expect(
      (screen.getByRole("radio", { name: /Part-time job/ }) as HTMLInputElement)
        .checked,
    ).toBe(false);
  });

  it("explains each job type where it is chosen", () => {
    renderForm();

    expect(screen.getByText("A regular job with its own hours.")).toBeDefined();
    expect(
      screen.getByText(/Counts towards the monthly earnings limit/),
    ).toBeDefined();
  });

  it("starts as a part-time job", () => {
    renderForm();

    expect(
      (screen.getByRole("radio", { name: /Part-time job/ }) as HTMLInputElement)
        .checked,
    ).toBe(true);
  });

  it("shows the euro sign in front of the rate, not in the label", () => {
    renderForm();

    expect(screen.getByLabelText("Hourly rate").className).toContain("pl-7");
    expect(screen.getByText("€").getAttribute("aria-hidden")).toBe("true");
  });

  it("moves focus to the first field with an error", () => {
    renderForm();
    fillIn("Name", "Cafe");

    submit();

    expect(document.activeElement).toBe(screen.getByLabelText("Hourly rate"));
  });

  it("shows a field's error when it is left, and clears it once fixed", () => {
    renderForm();
    fillIn("Hourly rate", "abc");

    fireEvent.blur(screen.getByLabelText("Hourly rate"));
    expect(
      screen.getByText("Enter the hourly rate as an amount, for example 12.50"),
    ).toBeDefined();

    fillIn("Hourly rate", "12.5");
    expect(
      screen.queryByText(
        "Enter the hourly rate as an amount, for example 12.50",
      ),
    ).toBeNull();
  });

  it("shows errors and does not submit when the name or rate is invalid", async () => {
    const { onSubmit } = renderForm();

    fillIn("Hourly rate", "abc");
    submit();

    expect(await screen.findByText("Name is required")).toBeDefined();
    expect(
      screen.getByText("Enter the hourly rate as an amount, for example 12.50"),
    ).toBeDefined();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits a trimmed name, a dot-decimal rate and the chosen type", async () => {
    const { onSubmit } = renderForm();

    fillIn("Name", "  Cafe  ");
    fillIn("Hourly rate", "13,5");
    fireEvent.click(screen.getByRole("radio", { name: /Mini-job/ }));
    submit();

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        name: "Cafe",
        hourlyRate: "13.5",
        type: "mini_job",
        vacationHoursPerYear: null,
        vacationCarryOverHours: "0",
        vacationCarryOverYear: null,
      }),
    );
  });

  it("shows the server's field errors next to the matching field", async () => {
    const onSubmit = vi.fn().mockRejectedValue(
      new ApiError(400, "Validation failed", {
        hourlyRate: ["Hourly rate must be greater than 0"],
      }),
    );
    renderForm({ onSubmit });

    fillIn("Name", "Cafe");
    fillIn("Hourly rate", "0");
    submit();

    const message = await screen.findByText(
      "Hourly rate must be greater than 0",
    );
    const input = screen.getByLabelText("Hourly rate");
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

  it("shows a generic message for unexpected errors", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("network down"));
    renderForm({ onSubmit });

    fillValid();
    submit();

    expect(
      await screen.findByText("Something went wrong. Please try again."),
    ).toBeDefined();
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
    expect((screen.getByLabelText("Name") as HTMLInputElement).disabled).toBe(
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
    const { container } = render(
      <JobForm submitLabel="Add job" onSubmit={vi.fn()} />,
    );

    expect(screen.getByLabelText("Name").className).toContain(
      "rounded-control",
    );
    expect(container.innerHTML).not.toMatch(/slate-|indigo-|red-/);
  });

  it("shows the no-field error in the shared danger alert", async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValue(new ApiError(404, "Job not found"));
    renderForm({
      onSubmit,
      submitLabel: "Save changes",
      initialValues: { name: "Cafe", hourlyRate: "10.50", type: "mini_job" },
    });

    submit("Save changes");

    const message = await screen.findByText("Job not found");
    expect(message.closest('[role="alert"]')?.className).toContain(
      "bg-danger-soft",
    );
  });

  it("sizes its box from its content, not from a basis of 0, so Safari on iPhone does not collapse it", () => {
    renderForm();

    const form = screen
      .getByRole("button", { name: /^(Add|Save)/ })
      .closest("form") as HTMLElement;
    expect(form.className.split(" ")).toContain("flex-auto");
    expect(form.className.split(" ")).not.toContain("flex-1");
  });

  describe("paid vacation", () => {
    const HOURS_MESSAGE = "Enter the hours per year, for example 80";
    const CARRY_MESSAGE = "Enter the carried-over hours, for example 8";

    function turnOn() {
      fireEvent.click(
        screen.getByRole("switch", { name: "Track paid vacation" }),
      );
    }

    it("is off for a new job and hides the fields", () => {
      renderForm();

      expect((screen.getByRole("switch") as HTMLInputElement).checked).toBe(
        false,
      );
      expect(screen.queryByLabelText("Hours per year")).toBeNull();
    });

    it("sends the three fields when it is on", async () => {
      const { onSubmit } = renderForm();
      fillValid();
      turnOn();
      fillIn("Hours per year", "80,5");
      fillIn("Carried over from last year (optional)", "8");
      submit();

      await waitFor(() =>
        expect(onSubmit).toHaveBeenCalledWith({
          name: "Cafe",
          hourlyRate: "10",
          type: "part_time",
          vacationHoursPerYear: "80.5",
          vacationCarryOverHours: "8",
          vacationCarryOverYear: 2026,
        }),
      );
    });

    it("sends no carry-over year when nothing is carried over", async () => {
      const { onSubmit } = renderForm();
      fillValid();
      turnOn();
      fillIn("Hours per year", "80");
      fillIn("Carried over from last year (optional)", "0");
      submit();

      await waitFor(() =>
        expect(onSubmit).toHaveBeenCalledWith({
          name: "Cafe",
          hourlyRate: "10",
          type: "part_time",
          vacationHoursPerYear: "80",
          vacationCarryOverHours: "0",
          vacationCarryOverYear: null,
        }),
      );
    });

    it("sends the use-this result as the hours", async () => {
      const { onSubmit } = renderForm();
      fillValid();
      turnOn();
      fillIn("Hours per week", "22");
      fireEvent.click(screen.getByRole("button", { name: "Use this" }));
      submit();

      await waitFor(() =>
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({ vacationHoursPerYear: "88" }),
        ),
      );
    });

    it("sends the off values after the switch is turned off again", async () => {
      const { onSubmit } = renderForm();
      fillValid();
      turnOn();
      fillIn("Hours per year", "abc");
      turnOn();
      submit();

      await waitFor(() =>
        expect(onSubmit).toHaveBeenCalledWith({
          name: "Cafe",
          hourlyRate: "10",
          type: "part_time",
          vacationHoursPerYear: null,
          vacationCarryOverHours: "0",
          vacationCarryOverYear: null,
        }),
      );
    });

    it.each(["abc", "0", "1001", "80.123"])(
      "shows an error for %s hours after leaving the field",
      (value) => {
        renderForm();
        turnOn();
        fillIn("Hours per year", value);

        fireEvent.blur(screen.getByLabelText("Hours per year"));

        expect(screen.getByText(HOURS_MESSAGE)).toBeDefined();
      },
    );

    it("does not submit and focuses the hours when they are invalid", () => {
      const { onSubmit } = renderForm();
      fillValid();
      turnOn();
      submit();

      expect(screen.getByText(HOURS_MESSAGE)).toBeDefined();
      expect(document.activeElement).toBe(
        screen.getByLabelText("Hours per year"),
      );
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("rejects carried-over hours above 1000 or with too many decimals", () => {
      const { onSubmit } = renderForm();
      fillValid();
      turnOn();
      fillIn("Hours per year", "80");
      fillIn("Carried over from last year (optional)", "1001");
      submit();

      expect(screen.getByText(CARRY_MESSAGE)).toBeDefined();
      expect(document.activeElement).toBe(
        screen.getByLabelText("Carried over from last year (optional)"),
      );
      fillIn("Carried over from last year (optional)", "1.234");
      expect(screen.getByText(CARRY_MESSAGE)).toBeDefined();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("starts on with its values for a job that tracks vacation", async () => {
      const { onSubmit } = renderForm({
        submitLabel: "Save changes",
        initialValues: {
          name: "Cafe",
          hourlyRate: "10.00",
          type: "part_time",
          vacationHoursPerYear: "80.00",
          vacationCarryOverHours: "8.00",
          vacationCarryOverYear: 2026,
        },
      });

      expect((screen.getByRole("switch") as HTMLInputElement).checked).toBe(
        true,
      );
      expect(
        (screen.getByLabelText("Hours per year") as HTMLInputElement).value,
      ).toBe("80.00");
      submit("Save changes");

      await waitFor(() =>
        expect(onSubmit).toHaveBeenCalledWith({
          name: "Cafe",
          hourlyRate: "10.00",
          type: "part_time",
          vacationHoursPerYear: "80.00",
          vacationCarryOverHours: "8.00",
          vacationCarryOverYear: 2026,
        }),
      );
    });

    describe("the stored carry-over year", () => {
      const stored = {
        name: "Cafe",
        hourlyRate: "10.00",
        type: "part_time" as const,
        vacationHoursPerYear: "80.00",
        vacationCarryOverHours: "8.00",
        vacationCarryOverYear: 2025,
      };
      const CARRY = "Carried over from last year (optional)";

      it("keeps the stored year when the hours are unchanged", async () => {
        const { onSubmit } = renderForm({
          submitLabel: "Save changes",
          initialValues: stored,
        });
        submit("Save changes");

        await waitFor(() =>
          expect(onSubmit).toHaveBeenCalledWith(
            expect.objectContaining({
              vacationCarryOverHours: "8.00",
              vacationCarryOverYear: 2025,
            }),
          ),
        );
      });

      it("keeps the stored year when the same hours are typed another way", async () => {
        const { onSubmit } = renderForm({
          submitLabel: "Save changes",
          initialValues: stored,
        });
        fillIn(CARRY, "8");
        submit("Save changes");

        await waitFor(() =>
          expect(onSubmit).toHaveBeenCalledWith(
            expect.objectContaining({ vacationCarryOverYear: 2025 }),
          ),
        );
      });

      it("uses the current year when the hours change", async () => {
        const { onSubmit } = renderForm({
          submitLabel: "Save changes",
          initialValues: stored,
        });
        fillIn(CARRY, "10");
        submit("Save changes");

        await waitFor(() =>
          expect(onSubmit).toHaveBeenCalledWith(
            expect.objectContaining({
              vacationCarryOverHours: "10",
              vacationCarryOverYear: 2026,
            }),
          ),
        );
      });

      it("uses the current year for a job that did not track vacation", async () => {
        const { onSubmit } = renderForm({
          submitLabel: "Save changes",
          initialValues: {
            ...stored,
            vacationHoursPerYear: null,
            vacationCarryOverHours: "8.00",
            vacationCarryOverYear: 2025,
          },
        });
        turnOn();
        fillIn("Hours per year", "80");
        fillIn(CARRY, "8");
        submit("Save changes");

        await waitFor(() =>
          expect(onSubmit).toHaveBeenCalledWith(
            expect.objectContaining({ vacationCarryOverYear: 2026 }),
          ),
        );
      });

      it("sends 0 and no year when the carry-over is emptied", async () => {
        const { onSubmit } = renderForm({
          submitLabel: "Save changes",
          initialValues: stored,
        });
        fillIn(CARRY, "");
        submit("Save changes");

        await waitFor(() =>
          expect(onSubmit).toHaveBeenCalledWith(
            expect.objectContaining({
              vacationCarryOverHours: "0",
              vacationCarryOverYear: null,
            }),
          ),
        );
      });
    });

    it("shows the server's errors next to the vacation fields", async () => {
      const onSubmit = vi.fn().mockRejectedValue(
        new ApiError(400, "Validation failed", {
          vacationHoursPerYear: ["Too many hours"],
          vacationCarryOverHours: ["Carry-over needs a year"],
        }),
      );
      renderForm({ onSubmit });
      fillValid();
      turnOn();
      fillIn("Hours per year", "80");
      submit();

      expect(await screen.findByText("Too many hours")).toBeDefined();
      expect(screen.getByText("Carry-over needs a year")).toBeDefined();
    });
  });
});
