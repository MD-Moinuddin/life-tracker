import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { groupByWeek } from "../../lib/shift-groups";
import type { ShiftWeek } from "../../lib/shift-groups";
import { makeLeave, makeShift } from "../../test/fixtures";
import { ShiftGroup } from "./ShiftGroup";
import source from "./ShiftGroup.tsx?raw";

const MINI = {
  id: "job-2",
  name: "Arena",
  hourlyRate: "10.00",
  type: "mini_job",
} as const;

function renderGroup(shifts = [makeShift()]) {
  const [week] = groupByWeek(shifts);
  if (!week) throw new Error("no week");
  return render(
    <ShiftGroup title="This week" week={week} today="2026-10-01" />,
  );
}

describe("ShiftGroup", () => {
  it("shows the title and the totals of the week", () => {
    renderGroup([
      makeShift({ id: "a", workedMinutes: 480 }),
      makeShift({ id: "b", workedMinutes: 240 }),
    ]);

    expect(screen.getByRole("heading", { name: "This week" })).toBeDefined();
    expect(screen.getByText("2 shifts · 12h · €144.00")).toBeDefined();
  });

  it("lists a row per shift in one card", () => {
    const { container } = renderGroup([
      makeShift({ id: "a" }),
      makeShift({ id: "b" }),
    ]);

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(container.querySelector("ul")?.className).toContain("rounded-card");
  });

  it("keeps its heading in view while scrolling", () => {
    renderGroup();

    expect(
      screen.getByRole("heading", { name: "This week" }).parentElement
        ?.className,
    ).toContain("sticky");
  });

  it("shows the job type on each row only when the week mixes types", () => {
    const { unmount } = renderGroup([makeShift({ id: "a" })]);
    expect(screen.queryByText("Part-time job")).toBeNull();
    unmount();

    renderGroup([
      makeShift({ id: "a" }),
      makeShift({ id: "b", jobId: "job-2", job: MINI }),
    ]);
    expect(screen.getByText("Part-time job")).toBeDefined();
    expect(screen.getByText("Mini-job")).toBeDefined();
  });

  describe("with paid leave", () => {
    // Mon 5 to Fri 9 Oct, 4h a day at the Cafe.
    const leave = makeLeave({
      id: "leave-oct",
      startDate: "2026-10-05",
      endDate: "2026-10-09",
    });

    it("puts a leave period after the week's shifts, with its own row", () => {
      const [week] = groupByWeek([makeShift({ id: "a" })]);
      render(
        <ShiftGroup
          title="This week"
          week={week as ShiftWeek}
          leave={[leave]}
          today="2026-10-01"
        />,
      );

      const items = screen.getAllByRole("listitem");
      expect(items).toHaveLength(2);
      expect(items[0]?.textContent).toContain("Warehouse");
      expect(items[1]?.textContent).toContain("Paid leave · Cafe");
      expect(items[1]?.textContent).toContain("5 days · 20h · €280.00");
    });

    it("keeps the totals to the shifts and adds the days of paid leave", () => {
      const [week] = groupByWeek([makeShift({ id: "a" })]);
      render(
        <ShiftGroup
          title="This week"
          week={week as ShiftWeek}
          leave={[leave]}
          today="2026-10-01"
        />,
      );

      expect(
        screen.getByText("1 shift · 8h · €96.00 · 5 days paid leave"),
      ).toBeDefined();
    });

    it("sums up a week with only leave by its days of paid leave", () => {
      render(
        <ShiftGroup
          title="This week"
          week={{
            weekStart: "2026-10-05",
            shifts: [],
            count: 0,
            minutes: 0,
            cents: 0,
          }}
          leave={[leave]}
          today="2026-10-01"
        />,
      );

      expect(screen.getByText("5 days paid leave")).toBeDefined();
      expect(screen.getAllByRole("listitem")).toHaveLength(1);
    });

    it("gives the leave rows Edit and Delete when handlers are given", () => {
      const onEditLeave = vi.fn();
      const onDeleteLeave = vi.fn();
      render(
        <ShiftGroup
          title="This week"
          week={{
            weekStart: "2026-10-05",
            shifts: [],
            count: 0,
            minutes: 0,
            cents: 0,
          }}
          leave={[leave]}
          today="2026-10-01"
          onEditLeave={onEditLeave}
          onDeleteLeave={onDeleteLeave}
        />,
      );
      const trigger = screen.getByRole("button", {
        name: "Actions for paid leave, Cafe, 5 Oct to 9 Oct",
      });

      fireEvent.click(trigger);
      fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
      expect(onEditLeave).toHaveBeenCalledWith(leave);
      fireEvent.click(trigger);
      fireEvent.click(screen.getByRole("menuitem", { name: "Delete…" }));
      expect(onDeleteLeave).toHaveBeenCalledWith(leave);
    });

    it("leaves the totals unchanged when there is no leave", () => {
      renderGroup([makeShift({ id: "a" })]);

      expect(screen.getByText("1 shift · 8h · €96.00")).toBeDefined();
    });
  });

  it("uses design tokens only, no raw palette classes", () => {
    expect(source).not.toMatch(/\b(slate|indigo|red|gray|amber|teal)-\d/);
  });
});
