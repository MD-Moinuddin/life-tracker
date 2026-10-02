import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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

describe("DeleteJobConfirmation", () => {
  it.each([
    [0, "This job has no shifts."],
    [1, "Its 1 logged shift will be deleted too."],
    [3, "Its 3 logged shifts will be deleted too."],
  ])("for %i shifts says: %s", (shiftCount, sentence) => {
    render(
      <DeleteJobConfirmation
        job={{ ...warehouse, shiftCount }}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText("Warehouse")).toBeDefined();
    expect(screen.getByText(sentence)).toBeDefined();
    expect(screen.getByText("This cannot be undone.")).toBeDefined();
  });

  it("confirms with a button named Delete job", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(
      <DeleteJobConfirmation
        job={warehouse}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete job" }));

    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
  });
});
