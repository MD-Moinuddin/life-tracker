import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ShiftLists } from "../../hooks/useShiftLists";
import { makeLeave, makeShift } from "../../test/fixtures";
import { ShiftSections } from "./ShiftSections";
import source from "./ShiftSections.tsx?raw";

function makeLists(overrides: Partial<ShiftLists> = {}): ShiftLists {
  return {
    today: "2026-10-03",
    upcoming: { status: "ready", data: [makeShift({ id: "up" })] },
    history: { status: "ready", data: [] },
    upcomingLeave: { status: "ready", data: [] },
    historyLeave: { status: "ready", data: [] },
    weekStart: "2026-10-05",
    weekEnd: "2026-10-11",
    canGoNext: true,
    previousWeek: vi.fn(),
    nextWeek: vi.fn(),
    reloadShifts: vi.fn(),
    reloadLeave: vi.fn(),
    ...overrides,
  };
}

function showHistory() {
  fireEvent.click(screen.getByRole("button", { name: "History" }));
}

describe("ShiftSections", () => {
  it("shows the upcoming shifts first, and a message for an empty history", () => {
    render(<ShiftSections lists={makeLists()} />);

    expect(
      within(
        screen.getByRole("region", { name: "Upcoming shifts" }),
      ).getAllByRole("listitem"),
    ).toHaveLength(1);

    showHistory();

    expect(
      within(screen.getByRole("region", { name: "Shift history" })).getByText(
        "No finished shifts in this week.",
      ),
    ).toBeDefined();
  });

  it("switches between the two tabs, marking the current one", () => {
    render(<ShiftSections lists={makeLists()} />);
    const upcoming = screen.getByRole("button", { name: "Upcoming" });
    const history = screen.getByRole("button", { name: "History" });
    expect(upcoming.getAttribute("aria-pressed")).toBe("true");

    showHistory();

    expect(upcoming.getAttribute("aria-pressed")).toBe("false");
    expect(history.getAttribute("aria-pressed")).toBe("true");
    expect(
      screen.queryByRole("region", { name: "Upcoming shifts" }),
    ).toBeNull();
  });

  it("shows no action menu when it is read-only", () => {
    render(<ShiftSections lists={makeLists()} />);

    expect(screen.queryByRole("button", { name: /^Actions for / })).toBeNull();
  });

  it("offers Edit and Delete in the row menu when handlers are given", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <ShiftSections lists={makeLists()} onEdit={onEdit} onDelete={onDelete} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /^Actions for / }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit shift" }));
    fireEvent.click(screen.getByRole("button", { name: /^Actions for / }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete shift…" }));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("groups the shifts by week under a title with the totals", () => {
    render(
      <ShiftSections
        lists={makeLists({
          upcoming: {
            status: "ready",
            data: [
              makeShift({ id: "a", date: "2026-10-03" }),
              makeShift({ id: "b", date: "2026-10-06" }),
            ],
          },
        })}
      />,
    );

    expect(screen.getByRole("heading", { name: "This week" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Next week" })).toBeDefined();
    expect(screen.getAllByText("1 shift · 8h · €96.00")).toHaveLength(2);
  });

  it("highlights only the next upcoming shift", () => {
    render(
      <ShiftSections
        lists={makeLists({
          upcoming: {
            status: "ready",
            data: [
              makeShift({ id: "a", date: "2026-10-03" }),
              makeShift({ id: "b", date: "2026-10-04" }),
            ],
          },
        })}
      />,
    );

    const rows = screen.getAllByRole("listitem");
    expect(rows[0]?.className).toContain("bg-accent-soft");
    expect(rows[1]?.className).not.toContain("bg-accent-soft");
  });

  it("wires the week buttons to the lists in History", () => {
    const lists = makeLists();
    render(<ShiftSections lists={lists} />);
    showHistory();

    fireEvent.click(screen.getByRole("button", { name: "Previous week" }));
    fireEvent.click(screen.getByRole("button", { name: "Next week" }));

    expect(lists.previousWeek).toHaveBeenCalledTimes(1);
    expect(lists.nextWeek).toHaveBeenCalledTimes(1);
  });

  it("shows loading and error states in a tab", () => {
    render(
      <ShiftSections
        lists={makeLists({
          upcoming: { status: "loading" },
          history: { status: "error" },
        })}
      />,
    );

    expect(screen.getByText("Loading your shifts…")).toBeDefined();

    showHistory();

    expect(screen.getByRole("alert")).toBeDefined();
  });

  it("puts extra controls at the right of the tabs", () => {
    render(
      <ShiftSections
        lists={makeLists()}
        toolbarEnd={<button type="button">Extra</button>}
      />,
    );

    expect(screen.getByRole("button", { name: "Extra" })).toBeDefined();
  });

  it("shows an empty tab as the shared empty card", () => {
    render(<ShiftSections lists={makeLists()} />);
    showHistory();

    const message = screen.getByText("No finished shifts in this week.");
    expect(message.parentElement?.className).toContain("border-dashed");
  });

  it("uses no raw palette colours", () => {
    const { container } = render(<ShiftSections lists={makeLists()} />);

    expect(container.innerHTML).not.toMatch(/slate-|indigo-|red-/);
  });

  describe("with paid leave", () => {
    // Today is Sat 3 Oct; this week is Mon 28 Sep to Sun 4 Oct.
    const nextWeekLeave = makeLeave({
      id: "next-week",
      startDate: "2026-10-05",
      endDate: "2026-10-09",
    });

    it("shows a leave period as one row in the week of its start, after that week's shifts", () => {
      render(
        <ShiftSections
          lists={makeLists({
            upcoming: {
              status: "ready",
              data: [makeShift({ id: "b", date: "2026-10-06" })],
            },
            upcomingLeave: { status: "ready", data: [nextWeekLeave] },
          })}
        />,
      );

      const group = screen
        .getByRole("heading", { name: "Next week" })
        .closest("section") as HTMLElement;
      const rows = within(group).getAllByRole("listitem");
      expect(rows).toHaveLength(2);
      expect(rows[0]?.textContent).toContain("Warehouse");
      expect(within(rows[1] as HTMLElement).getByText("Paid leave · Cafe"));
      expect(
        within(rows[1] as HTMLElement).getByText("5 Oct to 9 Oct"),
      ).toBeDefined();
      expect(
        within(rows[1] as HTMLElement).getByText("5 days · 20h · €280.00"),
      ).toBeDefined();
      expect(
        within(group).getByText("1 shift · 8h · €96.00 · 5 days paid leave"),
      ).toBeDefined();
    });

    it("gives a week with only leave its own group, in date order", () => {
      render(
        <ShiftSections
          lists={makeLists({
            upcoming: {
              status: "ready",
              data: [makeShift({ id: "a", date: "2026-10-03" })],
            },
            upcomingLeave: { status: "ready", data: [nextWeekLeave] },
          })}
        />,
      );

      expect(
        screen
          .getAllByRole("heading", { level: 2 })
          .map((heading) => heading.textContent),
      ).toEqual(["This week", "Next week"]);
      expect(screen.getByText("5 days paid leave")).toBeDefined();
    });

    it("shows the leave instead of the empty message when there are no shifts", () => {
      render(
        <ShiftSections
          lists={makeLists({
            upcoming: { status: "ready", data: [] },
            upcomingLeave: { status: "ready", data: [nextWeekLeave] },
          })}
        />,
      );

      expect(screen.queryByText("No upcoming shifts.")).toBeNull();
      expect(screen.getByText("Paid leave · Cafe")).toBeDefined();
    });

    it("shows the shifts while the leave is still loading", () => {
      render(
        <ShiftSections
          lists={makeLists({ upcomingLeave: { status: "loading" } })}
        />,
      );

      expect(screen.getAllByRole("listitem")).toHaveLength(1);
      expect(screen.queryByText("Loading your shifts…")).toBeNull();
    });

    it("shows past leave of the week being viewed in History", () => {
      render(
        <ShiftSections
          lists={makeLists({
            weekStart: "2026-09-28",
            weekEnd: "2026-10-04",
            history: {
              status: "ready",
              data: [makeShift({ id: "old", date: "2026-09-29" })],
            },
            historyLeave: {
              status: "ready",
              data: [
                makeLeave({
                  id: "past",
                  startDate: "2026-09-30",
                  endDate: "2026-10-02",
                }),
              ],
            },
          })}
        />,
      );
      showHistory();

      const history = within(
        screen.getByRole("region", { name: "Shift history" }),
      );
      expect(history.getAllByRole("listitem")).toHaveLength(2);
      expect(history.getByText("30 Sep to 2 Oct")).toBeDefined();
      expect(history.getByText("Taken")).toBeDefined();
      expect(
        history.getByText("1 shift · 8h · €96.00 · 3 days paid leave"),
      ).toBeDefined();
    });

    it("groups History leave under the viewed week, with its past days in that week", () => {
      // Viewing Mon 5 to Sun 11 Oct with today Wed 7 Oct (navigator week).
      const spanning = makeLeave({
        id: "spanning",
        startDate: "2026-09-30",
        endDate: "2026-10-09",
      });
      render(
        <ShiftSections
          lists={makeLists({
            today: "2026-10-07",
            weekStart: "2026-10-05",
            weekEnd: "2026-10-11",
            history: { status: "ready", data: [] },
            historyLeave: { status: "ready", data: [spanning] },
            upcomingLeave: { status: "ready", data: [spanning] },
          })}
        />,
      );

      // Upcoming keeps the start-week rule: it is under Last week (28 Sep).
      expect(
        screen.getByRole("heading", { level: 2, name: "Last week" }),
      ).toBeDefined();

      showHistory();
      const history = within(
        screen.getByRole("region", { name: "Shift history" }),
      );
      expect(
        history
          .getAllByRole("heading", { level: 2 })
          .map((heading) => heading.textContent),
      ).toEqual(["This week"]);
      // Mon 5 and Tue 6 are in the week and before today.
      expect(history.getByText("2 days paid leave")).toBeDefined();
      expect(history.getAllByText("30 Sep to 9 Oct")).toHaveLength(1);
    });

    it("passes Edit and Delete to the leave rows", () => {
      const onEditLeave = vi.fn();
      const onDeleteLeave = vi.fn();
      render(
        <ShiftSections
          lists={makeLists({
            upcomingLeave: { status: "ready", data: [nextWeekLeave] },
          })}
          onEditLeave={onEditLeave}
          onDeleteLeave={onDeleteLeave}
        />,
      );
      const trigger = screen.getByRole("button", {
        name: "Actions for paid leave, Cafe, 5 Oct to 9 Oct",
      });

      fireEvent.click(trigger);
      fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
      fireEvent.click(trigger);
      fireEvent.click(screen.getByRole("menuitem", { name: "Delete…" }));

      expect(onEditLeave).toHaveBeenCalledWith(nextWeekLeave);
      expect(onDeleteLeave).toHaveBeenCalledWith(nextWeekLeave);
    });

    it("has no menu on the leave rows when it is read-only", () => {
      render(
        <ShiftSections
          lists={makeLists({
            upcomingLeave: { status: "ready", data: [nextWeekLeave] },
          })}
        />,
      );

      expect(
        screen.queryByRole("button", { name: /^Actions for paid leave/ }),
      ).toBeNull();
    });
  });

  it("uses design tokens only in its source", () => {
    expect(source).not.toMatch(/\b(slate|indigo|red|gray|amber|teal)-\d/);
  });
});
