import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../../lib/api-client";
import { JobForm } from "./JobForm";

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
});
