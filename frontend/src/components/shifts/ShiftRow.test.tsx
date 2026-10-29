import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Shift } from "../../lib/shifts-api";
import { makeShift } from "../../test/fixtures";
import { ShiftRow } from "./ShiftRow";

function renderRow(
  shift: Shift = makeShift(),
  props: Partial<Parameters<typeof ShiftRow>[0]> = {},
) {
  return render(
    <ul>
      <ShiftRow shift={shift} today="2026-10-01" {...props} />
    </ul>,
  );
}

describe("ShiftRow", () => {
  it("shows the job, the times, the earnings and the worked time", () => {
    renderRow(makeShift({ workedMinutes: 450, notes: "Early start" }));

    expect(screen.getByText("Warehouse")).toBeDefined();
    expect(screen.getByRole("listitem").textContent).toContain(
      "Sat 3 Oct, 09:00 to 17:00",
    );
    expect(screen.getByText("€90.00")).toBeDefined();
    expect(screen.getByText("7h 30m")).toBeDefined();
    expect(screen.getByText("Early start")).toBeDefined();
  });

  it("says the day once, in text for screen readers beside the tile", () => {
    renderRow();

    expect(screen.getByText("Sat 3 Oct,").className).toContain("sr-only");
    expect(screen.queryByText("Sat 3 Oct, 09:00 to 17:00")).toBeNull();
  });

  it("marks a shift that ends the next day", () => {
    renderRow(
      makeShift({
        startTime: "22:00",
        endTime: "02:00",
        endDate: "2026-10-04",
        workedMinutes: 240,
      }),
    );

    expect(screen.getByRole("listitem").textContent).toContain(
      "22:00 to 02:00 (next day)",
    );
  });

  it("shows a friendly label for a day that is close", () => {
    renderRow(makeShift({ date: "2026-10-03" }), { today: "2026-10-01" });

    expect(screen.getByText("In 2 days")).toBeDefined();
  });

  it("draws Today as the strong label", () => {
    renderRow(makeShift({ date: "2026-10-01" }), { today: "2026-10-01" });

    expect(screen.getByText("Today").className).toContain("bg-accent");
  });

  it("has no label for a day further away", () => {
    renderRow(makeShift({ date: "2026-12-01" }));

    expect(screen.queryByText(/^In \d+ days$/)).toBeNull();
  });

  it("marks the job with its colour on the left edge", () => {
    renderRow();

    expect(screen.getByRole("listitem").className).toMatch(/border-job-\d/);
  });

  it("shows the job type only when asked to", () => {
    const { unmount } = renderRow();
    expect(screen.queryByText("Part-time job")).toBeNull();
    unmount();

    renderRow(makeShift(), { showType: true });
    expect(screen.getByText("Part-time job")).toBeDefined();
  });

  it("highlights the next shift", () => {
    renderRow(makeShift(), { isNext: true });

    expect(screen.getByRole("listitem").className).toContain("bg-accent-soft");
  });

  it("has an action menu named after the shift, with Edit and Delete", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const shift = makeShift();
    renderRow(shift, { onEdit, onDelete });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Actions for Warehouse, Sat 3 Oct, 09:00 to 17:00",
      }),
    );
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit shift" }));
    expect(onEdit).toHaveBeenCalledWith(shift);

    fireEvent.click(screen.getByRole("button", { name: /^Actions for / }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete shift…" }));
    expect(onDelete).toHaveBeenCalledWith(shift);
  });

  it("offers only the actions it was given", () => {
    renderRow(makeShift(), { onEdit: vi.fn() });

    fireEvent.click(screen.getByRole("button", { name: /^Actions for / }));

    expect(screen.getAllByRole("menuitem")).toHaveLength(1);
    expect(
      screen.queryByRole("menuitem", { name: "Delete shift…" }),
    ).toBeNull();
  });

  it("has no menu without handlers", () => {
    renderRow();

    expect(screen.queryByRole("button")).toBeNull();
  });
});
