import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { makeShift } from "../../test/fixtures";
import { WeekAgenda } from "./WeekAgenda";

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
});
