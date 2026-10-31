import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { makeLeave } from "../../test/fixtures";
import { LeaveRow } from "./LeaveRow";
import source from "./LeaveRow.tsx?raw";

type RowProps = React.ComponentProps<typeof LeaveRow>;

function renderRow(props: Partial<React.ComponentProps<typeof LeaveRow>> = {}) {
  const onEdit = vi.fn();
  const onDelete = vi.fn();
  render(
    <ul>
      <LeaveRow
        leave={makeLeave()}
        variant="period"
        today="2026-10-07"
        onEdit={onEdit}
        onDelete={onDelete}
        {...(props as object)}
      />
    </ul>,
  );
  return { onEdit, onDelete };
}

describe("LeaveRow", () => {
  it("shows a period with its days, hours and pay, as taken", () => {
    renderRow();

    const row = within(screen.getByRole("listitem"));
    expect(row.getByText("9 Mar to 13 Mar")).toBeDefined();
    expect(row.getByText("5 days · 20h · €280.00")).toBeDefined();
    expect(row.getByText("Taken")).toBeDefined();
  });

  it("labels leave that has not ended as planned, today included", () => {
    renderRow({ today: "2026-03-13" });

    expect(screen.getByText("Planned")).toBeDefined();
    expect(screen.queryByText("Taken")).toBeNull();
  });

  it("counts only the chosen weekdays and rounds the pay half up", () => {
    renderRow({
      leave: makeLeave({
        weekdays: [1],
        minutesPerDay: 90,
        job: {
          id: "job-1",
          name: "Cafe",
          hourlyRate: "12.35",
          type: "part_time",
        },
      }),
    });

    // One Monday: 1 day, 1h 30m; 1235 cents x 90 / 60 = 1852.5 -> 1853.
    expect(screen.getByText("1 day · 1h 30m · €18.53")).toBeDefined();
  });

  it("shows one day in the day variant, as an amber row with its date tile", () => {
    renderRow({ variant: "day", date: "2026-03-10" });

    const item = screen.getByRole("listitem");
    const row = within(item);
    expect(row.getByText("Cafe")).toBeDefined();
    expect(row.getByText("Paid leave · 4h counted")).toBeDefined();
    expect(row.getByText("€56.00")).toBeDefined();
    expect(row.getByText("Taken")).toBeDefined();
    // The tile is decorative; the full date is said in text.
    expect(row.getByText("Tue 10 Mar,")).toBeDefined();
    expect(item.className).toContain("bg-leave-soft");
    expect(item.querySelector('[aria-hidden="true"]')?.textContent).toBe(
      "Tue10",
    );
  });

  it("names the day and the job on a day row's menu", () => {
    const leave = makeLeave();
    const { onEdit } = renderRow({ leave, variant: "day", date: "2026-03-10" });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Actions for paid leave, Cafe, Tue 10 Mar",
      }),
    );
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    expect(onEdit).toHaveBeenCalledWith(leave);
  });

  it("says Paid leave and the job on a period in the shift lists", () => {
    renderRow({ showJob: true, today: "2026-03-01" });

    const row = within(screen.getByRole("listitem"));
    expect(row.getByText("9 Mar to 13 Mar")).toBeDefined();
    expect(row.getByText("Paid leave · Cafe")).toBeDefined();
    expect(row.getByText("5 days · 20h · €280.00")).toBeDefined();
    expect(row.getByText("Planned")).toBeDefined();
    expect(
      row.getByRole("button", {
        name: "Actions for paid leave, Cafe, 9 Mar to 13 Mar",
      }),
    ).toBeDefined();
  });

  it("leaves the job out of a period on the job page", () => {
    renderRow();

    expect(screen.queryByText(/Paid leave · Cafe/)).toBeNull();
  });

  it("opens Edit and Delete from the menu", () => {
    const leave = makeLeave();
    const { onEdit, onDelete } = renderRow({ leave });

    const trigger = screen.getByRole("button", {
      name: "Actions for paid leave 9 Mar to 13 Mar",
    });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    expect(onEdit).toHaveBeenCalledWith(leave);

    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete…" }));
    expect(onDelete).toHaveBeenCalledWith(leave);
  });

  it("has no menu without handlers", () => {
    renderRow({ onEdit: undefined, onDelete: undefined });

    expect(screen.queryByRole("button")).toBeNull();
  });

  it("keeps the columns aligned when there is no menu", () => {
    renderRow({ onEdit: undefined, onDelete: undefined });

    const spacer = screen.getByRole("listitem").lastElementChild;
    expect(spacer?.className).toContain("w-9");
    expect(spacer?.className).toContain("pointer-coarse:w-11");
  });

  it("needs a date for the day variant", () => {
    // @ts-expect-error a day row without its date does not compile
    const bad: RowProps = { leave: makeLeave(), variant: "day", today: "" };
    expect(bad.variant).toBe("day");
  });

  it("uses design tokens only, no raw palette classes", () => {
    expect(source).not.toMatch(/\b(slate|indigo|red|gray|amber|teal)-\d/);
  });
});
