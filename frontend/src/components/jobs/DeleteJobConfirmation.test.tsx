import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { JobWithShiftCount } from "../../lib/jobs-api";
import { listShifts } from "../../lib/shifts-api";
import { makeShift, noVacation } from "../../test/fixtures";
import { DeleteJobConfirmation } from "./DeleteJobConfirmation";

vi.mock("../../lib/shifts-api", () => ({ listShifts: vi.fn() }));

const warehouse: JobWithShiftCount = {
  id: "job-1",
  name: "Warehouse",
  hourlyRate: "12.00",
  type: "part_time",
  createdAt: "2026-10-01T09:00:00.000Z",
  updatedAt: "2026-10-01T09:00:00.000Z",
  shiftCount: 3,
  ...noVacation,
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(listShifts).mockResolvedValue({
    items: [],
    total: 0,
    limit: 500,
    offset: 0,
  });
});

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

  it("adds up what the job's shifts are worth, once they have loaded", async () => {
    vi.mocked(listShifts).mockResolvedValue({
      items: [
        makeShift({ id: "a", workedMinutes: 480 }),
        makeShift({ id: "b", workedMinutes: 270 }),
      ],
      total: 2,
      limit: 500,
      offset: 0,
    });
    render(
      <DeleteJobConfirmation
        job={{ ...warehouse, shiftCount: 2 }}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(await screen.findByText("€150.00 of earnings")).toBeDefined();
    expect(screen.getByText("12h 30m of logged hours")).toBeDefined();
    expect(listShifts).toHaveBeenCalledWith({ jobId: "job-1", limit: 500 });
  });

  it("shows the warning at once, in the warning style, before the totals arrive", () => {
    vi.mocked(listShifts).mockReturnValue(new Promise(() => {}));
    render(
      <DeleteJobConfirmation
        job={warehouse}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    const warning = screen
      .getByText("Its 3 logged shifts will be deleted too.")
      .closest("div.border-warning-border");
    expect(warning).not.toBeNull();
    expect(screen.queryByText(/of earnings/)).toBeNull();
  });

  it("still warns, without the totals, when the shifts cannot be loaded", async () => {
    vi.mocked(listShifts).mockRejectedValue(new Error("network down"));
    render(
      <DeleteJobConfirmation
        job={warehouse}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    await waitFor(() => expect(listShifts).toHaveBeenCalled());
    expect(
      screen.getByText("Its 3 logged shifts will be deleted too."),
    ).toBeDefined();
    expect(screen.queryByText(/of earnings/)).toBeNull();
  });

  it("does not ask for shifts when the job has none, and uses no warning box", () => {
    render(
      <DeleteJobConfirmation
        job={{ ...warehouse, shiftCount: 0 }}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(listShifts).not.toHaveBeenCalled();
    expect(
      screen
        .getByText("This job has no shifts.")
        .closest("div.border-warning-border"),
    ).toBeNull();
  });
});
