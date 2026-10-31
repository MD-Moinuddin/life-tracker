import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { makeLeave, makeShift } from "../../test/fixtures";
import { WeekAgenda } from "./WeekAgenda";
import source from "./WeekAgenda.tsx?raw";

const shifts = [
  makeShift({ id: "a", date: "2026-10-05", startTime: "16:00" }),
  makeShift({ id: "b", date: "2026-10-07", startTime: "12:00" }),
  makeShift({ id: "c", date: "2026-10-07", startTime: "08:00" }),
];

function renderAgenda(props: Partial<Parameters<typeof WeekAgenda>[0]> = {}) {
  return render(
    <WeekAgenda
      shifts={shifts}
      weekStart="2026-10-05"
      today="2026-10-07"
      onEdit={vi.fn()}
      {...props}
    />,
  );
}

describe("WeekAgenda", () => {
  it("lists all seven days, Monday to Sunday", () => {
    renderAgenda();

    const days = screen
      .getAllByRole("heading", { level: 2 })
      .map((heading) => heading.textContent);
    expect(days).toEqual([
      "Mon 5 Oct",
      "Tue 6 Oct",
      "Wed 7 Oct",
      "Thu 8 Oct",
      "Fri 9 Oct",
      "Sat 10 Oct",
      "Sun 11 Oct",
    ]);
  });

  it("sums up the week", () => {
    renderAgenda();

    expect(screen.getByText("3 shifts · 24h · €288.00")).toBeDefined();
  });

  it("says No shifts on an empty day, once per empty day", () => {
    renderAgenda();

    expect(screen.getAllByText("No shifts")).toHaveLength(5);
  });

  it("marks today and shows its total and label", () => {
    renderAgenda();

    const today = screen
      .getByRole("heading", { name: "Wed 7 Oct" })
      .closest("li") as HTMLElement;
    expect(today.getAttribute("aria-current")).toBe("date");
    expect(within(today).getByText("Today")).toBeDefined();
    expect(within(today).getByText("2 shifts · 16h · €192.00")).toBeDefined();
  });

  it("orders a day's shifts by start time", () => {
    renderAgenda();

    const today = screen
      .getByRole("heading", { name: "Wed 7 Oct" })
      .closest("li") as HTMLElement;
    const times = within(today)
      .getAllByRole("listitem")
      .map((item) => item.textContent);
    expect(times[0]).toContain("08:00");
    expect(times[1]).toContain("12:00");
  });

  it("gives every shift a menu to edit and, when allowed, delete", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    renderAgenda({ onEdit, onDelete });

    fireEvent.click(
      screen.getAllByRole("button", {
        name: /^Actions for /,
      })[0] as HTMLElement,
    );
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete shift…" }));

    expect(onDelete).toHaveBeenCalledWith(shifts[0]);
    expect(onEdit).not.toHaveBeenCalled();
  });

  it("offers no delete without a delete handler", () => {
    renderAgenda();

    fireEvent.click(
      screen.getAllByRole("button", {
        name: /^Actions for /,
      })[0] as HTMLElement,
    );

    expect(
      screen.queryByRole("menuitem", { name: "Delete shift…" }),
    ).toBeNull();
  });

  describe("with paid leave", () => {
    // Thu 8 to Mon 12 Oct, Monday to Friday: Thu 8 and Fri 9 are in the week.
    const leave = makeLeave({
      id: "autumn",
      startDate: "2026-10-08",
      endDate: "2026-10-12",
    });

    function dayOf(name: string) {
      return screen.getByRole("heading", { name }).closest("li") as HTMLElement;
    }

    it("shows an amber row on each counted day, with the day's hours", () => {
      renderAgenda({ leave: [leave] });

      for (const name of ["Thu 8 Oct", "Fri 9 Oct"]) {
        const day = within(dayOf(name));
        const row = day.getByText("Paid leave · 4h counted").closest("li");
        expect(row?.className).toContain("bg-leave-soft");
        expect(row?.className).toContain("border-leave-edge");
        expect(day.queryByText("No shifts")).toBeNull();
      }
      expect(screen.getAllByText("Paid leave · 4h counted")).toHaveLength(2);
    });

    it("gives a leave day's heading the Paid leave pill and keeps the heading the day", () => {
      renderAgenda({ leave: [leave] });

      const thursday = within(dayOf("Thu 8 Oct"));
      expect(
        thursday.getByText("Paid leave", { selector: "span" }),
      ).toBeDefined();
      expect(
        screen.getByRole("heading", { name: "Thu 8 Oct" }).textContent,
      ).toBe("Thu 8 Oct");
    });

    it("leaves the days without leave unchanged", () => {
      renderAgenda({ leave: [leave] });

      const tuesday = within(dayOf("Tue 6 Oct"));
      expect(tuesday.getByText("No shifts")).toBeDefined();
      expect(tuesday.queryByText(/Paid leave/)).toBeNull();
      expect(screen.getAllByText("No shifts")).toHaveLength(3);
    });

    it("adds the days of paid leave to the week's total line", () => {
      renderAgenda({ leave: [leave] });

      expect(
        screen.getByText("3 shifts · 24h · €288.00 · 2 days paid leave"),
      ).toBeDefined();
    });

    it("offers Edit and Delete on a leave row", () => {
      const onEditLeave = vi.fn();
      const onDeleteLeave = vi.fn();
      renderAgenda({ leave: [leave], onEditLeave, onDeleteLeave });
      const trigger = screen.getByRole("button", {
        name: "Actions for paid leave, Cafe, Thu 8 Oct",
      });

      fireEvent.click(trigger);
      fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
      fireEvent.click(trigger);
      fireEvent.click(screen.getByRole("menuitem", { name: "Delete…" }));

      expect(onEditLeave).toHaveBeenCalledWith(leave);
      expect(onDeleteLeave).toHaveBeenCalledWith(leave);
    });

    it("drops the zero shift part when the week has leave but no shifts", () => {
      renderAgenda({ shifts: [], leave: [leave] });

      expect(screen.getByText("2 days paid leave")).toBeDefined();
      expect(screen.queryByText(/0 shifts/)).toBeNull();
    });

    it("still says 0 shifts for a week with nothing", () => {
      renderAgenda({ shifts: [], leave: [] });

      expect(screen.getByText("0 shifts · 0m · €0.00")).toBeDefined();
    });

    it("keeps the totals line unchanged with no leave", () => {
      renderAgenda({ leave: [] });

      expect(screen.getByText("3 shifts · 24h · €288.00")).toBeDefined();
    });
  });

  it("uses design tokens only, no raw palette classes", () => {
    expect(source).not.toMatch(/\b(slate|indigo|red|gray|amber|teal)-\d/);
  });
});
