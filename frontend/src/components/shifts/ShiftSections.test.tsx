import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ShiftLists } from "../../hooks/useShiftLists";
import { makeShift } from "../../test/fixtures";
import { ShiftSections } from "./ShiftSections";

function makeLists(overrides: Partial<ShiftLists> = {}): ShiftLists {
  return {
    today: "2026-10-03",
    upcoming: { status: "ready", data: [makeShift({ id: "up" })] },
    history: { status: "ready", data: [] },
    weekStart: "2026-10-05",
    weekEnd: "2026-10-11",
    canGoNext: true,
    previousWeek: vi.fn(),
    nextWeek: vi.fn(),
    reload: vi.fn(),
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
});
