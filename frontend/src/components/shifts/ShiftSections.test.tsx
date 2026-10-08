import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ShiftLists } from "../../hooks/useShiftLists";
import { makeShift } from "../../test/fixtures";
import { ShiftSections } from "./ShiftSections";

function makeLists(overrides: Partial<ShiftLists> = {}): ShiftLists {
  return {
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

function section(name: string) {
  return within(screen.getByRole("region", { name }));
}

describe("ShiftSections", () => {
  it("shows the upcoming shifts, and a message for an empty history", () => {
    render(<ShiftSections lists={makeLists()} />);

    expect(section("Upcoming").getAllByRole("listitem")).toHaveLength(1);
    expect(
      section("History").getByText("No finished shifts in this week."),
    ).toBeDefined();
  });

  it("shows no Edit or Delete buttons when it is read-only", () => {
    render(<ShiftSections lists={makeLists()} />);

    expect(screen.queryByRole("button", { name: /^Edit / })).toBeNull();
    expect(screen.queryByRole("button", { name: /^Delete / })).toBeNull();
  });

  it("shows and reports Edit and Delete when handlers are given", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <ShiftSections lists={makeLists()} onEdit={onEdit} onDelete={onDelete} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /^Edit / }));
    fireEvent.click(screen.getByRole("button", { name: /^Delete / }));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("wires the week buttons to the lists", () => {
    const lists = makeLists();
    render(<ShiftSections lists={lists} />);

    fireEvent.click(screen.getByRole("button", { name: "Previous week" }));
    fireEvent.click(screen.getByRole("button", { name: "Next week" }));

    expect(lists.previousWeek).toHaveBeenCalledTimes(1);
    expect(lists.nextWeek).toHaveBeenCalledTimes(1);
  });

  it("shows loading and error states in a section", () => {
    render(
      <ShiftSections
        lists={makeLists({
          upcoming: { status: "loading" },
          history: { status: "error" },
        })}
      />,
    );

    expect(section("Upcoming").getByText("Loading your shifts…")).toBeDefined();
    expect(section("History").getByRole("alert")).toBeDefined();
  });
});
