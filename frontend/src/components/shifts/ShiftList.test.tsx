import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Shift } from "../../lib/shifts-api";
import { makeShift } from "../../test/fixtures";
import { ShiftList } from "./ShiftList";

function renderList(
  shifts: Shift[],
  handlers: { onEdit?: () => void; onDelete?: () => void } = {},
) {
  render(<ShiftList shifts={shifts} {...handlers} />);
}

describe("ShiftList", () => {
  it("shows the job, the day and times, the worked time and the notes", () => {
    renderList([makeShift({ workedMinutes: 450, notes: "Early start" })]);

    expect(screen.getByText("Warehouse")).toBeDefined();
    expect(screen.getByText("Sat 3 Oct, 09:00 to 17:00")).toBeDefined();
    expect(screen.getByText("7h 30m")).toBeDefined();
    expect(screen.getByText("Early start")).toBeDefined();
  });

  it("marks a shift that ends the next day", () => {
    renderList([
      makeShift({
        startTime: "22:00",
        endTime: "02:00",
        endDate: "2026-10-04",
        workedMinutes: 240,
      }),
    ]);

    expect(
      screen.getByText("Sat 3 Oct, 22:00 to 02:00 (next day)"),
    ).toBeDefined();
  });

  it("shows one row per shift and no notes line when there are none", () => {
    renderList([makeShift({ id: "a" }), makeShift({ id: "b", notes: null })]);

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.queryByText("Early start")).toBeNull();
  });

  it("reports which shift to edit, with a button that describes the shift", () => {
    const onEdit = vi.fn();
    const shift = makeShift();
    renderList([shift], { onEdit });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Edit Warehouse, Sat 3 Oct, 09:00 to 17:00",
      }),
    );

    expect(onEdit).toHaveBeenCalledWith(shift);
  });

  it("reports which shift to delete, with a button that describes the shift", () => {
    const onDelete = vi.fn();
    const shift = makeShift();
    renderList([shift], { onDelete });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Delete Warehouse, Sat 3 Oct, 09:00 to 17:00",
      }),
    );

    expect(onDelete).toHaveBeenCalledWith(shift);
  });

  it("shows no Edit or Delete buttons without handlers", () => {
    renderList([makeShift()]);

    expect(screen.queryByRole("button")).toBeNull();
  });

  it("shows a date tile with the weekday over the day number", () => {
    renderList([makeShift()]);

    expect(screen.getByText("Sat")).toBeDefined();
    expect(screen.getByText("3")).toBeDefined();
  });

  it("shows the job's type as a badge next to its name", () => {
    renderList([makeShift()]);

    expect(screen.getByText("Part-time job").className).toContain(
      "bg-neutral-soft",
    );
  });

  it("draws Edit as a plain button and Delete as the quiet danger button", () => {
    renderList([makeShift()], { onEdit: vi.fn(), onDelete: vi.fn() });

    expect(screen.getByRole("button", { name: /^Edit / }).className).toContain(
      "border-border-strong",
    );
    expect(
      screen.getByRole("button", { name: /^Delete / }).className,
    ).toContain("text-danger");
  });

  it("draws the rows as one card with dividers and no raw palette colours", () => {
    const { container } = render(
      <ShiftList shifts={[makeShift({ id: "a" }), makeShift({ id: "b" })]} />,
    );

    expect(container.querySelector("ul")?.className).toContain("rounded-card");
    expect(container.querySelector("ul")?.className).toContain("divide-y");
    expect(container.innerHTML).not.toMatch(/slate-|indigo-|red-/);
  });
});
