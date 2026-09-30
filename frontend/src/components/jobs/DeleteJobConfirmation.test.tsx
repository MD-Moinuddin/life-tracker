import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../../lib/api-client";
import type { JobWithShiftCount } from "../../lib/jobs-api";
import { DeleteJobConfirmation } from "./DeleteJobConfirmation";

const warehouse: JobWithShiftCount = {
  id: "job-1",
  name: "Warehouse",
  hourlyRate: "12.00",
  type: "part_time",
  createdAt: "2026-10-01T09:00:00.000Z",
  updatedAt: "2026-10-01T09:00:00.000Z",
  shiftCount: 3,
};

function renderConfirmation(
  props: Partial<ComponentProps<typeof DeleteJobConfirmation>> = {},
) {
  const onConfirm = vi.fn().mockResolvedValue(undefined);
  const onCancel = vi.fn();
  render(
    <DeleteJobConfirmation
      job={warehouse}
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...props}
    />,
  );
  return { onConfirm, onCancel };
}

describe("DeleteJobConfirmation", () => {
  it.each([
    [0, "This job has no shifts."],
    [1, "Its 1 logged shift will be deleted too."],
    [3, "Its 3 logged shifts will be deleted too."],
  ])("for %i shifts says: %s", (shiftCount, sentence) => {
    renderConfirmation({ job: { ...warehouse, shiftCount } });

    expect(screen.getByText("Warehouse")).toBeDefined();
    expect(screen.getByText(sentence)).toBeDefined();
    expect(screen.getByText("This cannot be undone.")).toBeDefined();
  });

  it("puts Cancel before Delete, so a hasty keypress cancels", () => {
    renderConfirmation();

    const names = screen
      .getAllByRole("button")
      .map((button) => button.textContent);

    expect(names).toEqual(["Cancel", "Delete job"]);
  });

  it("calls onCancel when Cancel is pressed", () => {
    const { onCancel, onConfirm } = renderConfirmation();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("calls onConfirm when Delete job is pressed", async () => {
    const { onConfirm } = renderConfirmation();

    fireEvent.click(screen.getByRole("button", { name: "Delete job" }));

    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
  });

  it("disables both buttons while deleting", async () => {
    let finish: () => void = () => {};
    const onConfirm = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    renderConfirmation({ onConfirm });

    fireEvent.click(screen.getByRole("button", { name: "Delete job" }));

    await screen.findByText("Deleting…");
    expect(
      (screen.getByRole("button", { name: "Cancel" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);

    finish();
    await waitFor(() => expect(screen.queryByText("Deleting…")).toBeNull());
  });

  it("shows the server's message when deleting fails", async () => {
    renderConfirmation({
      onConfirm: vi.fn().mockRejectedValue(new ApiError(404, "Job not found")),
    });

    fireEvent.click(screen.getByRole("button", { name: "Delete job" }));

    expect(await screen.findByText("Job not found")).toBeDefined();
  });

  it("shows a generic message for unexpected errors", async () => {
    renderConfirmation({
      onConfirm: vi.fn().mockRejectedValue(new Error("network down")),
    });

    fireEvent.click(screen.getByRole("button", { name: "Delete job" }));

    expect(
      await screen.findByText("Something went wrong. Please try again."),
    ).toBeDefined();
  });
});
