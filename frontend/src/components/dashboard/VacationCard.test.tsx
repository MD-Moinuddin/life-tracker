import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { makeLeave, noVacation } from "../../test/fixtures";
import type { JobWithShiftCount } from "../../lib/jobs-api";
import type { VacationBalance } from "../../lib/vacation";
import { VacationCard, VacationCardSkeleton } from "./VacationCard";
import source from "./VacationCard.tsx?raw";

function job(overrides: Partial<JobWithShiftCount> = {}): JobWithShiftCount {
  return {
    id: "job-1",
    name: "Cafe",
    hourlyRate: "14.00",
    type: "part_time",
    createdAt: "2026-01-01T09:00:00.000Z",
    updatedAt: "2026-01-01T09:00:00.000Z",
    shiftCount: 1,
    ...noVacation,
    vacationHoursPerYear: "80.00",
    ...overrides,
  };
}

function balance(overrides: Partial<VacationBalance> = {}): VacationBalance {
  return {
    entitlementMinutes: 4800,
    carriedOverMinutes: 0,
    takenMinutes: 2400,
    plannedMinutes: 1680,
    leftMinutes: 720,
    ...overrides,
  };
}

const planned = makeLeave({
  startDate: "2026-12-28",
  endDate: "2026-12-29",
});

describe("VacationCard", () => {
  it("shows one job's figure, bar, next leave and the add action", () => {
    const onAddLeave = vi.fn();
    render(
      <VacationCard
        rows={[{ job: job(), balance: balance(), next: planned }]}
        onAddLeave={onAddLeave}
      />,
    );

    const card = within(screen.getByRole("region", { name: "Paid vacation" }));
    expect(card.getByText("12h")).toBeDefined();
    expect(card.getByText("left of 80h")).toBeDefined();
    expect(
      card.getByRole("img", {
        name: "40h taken, 28h planned, 12h left of 80h",
      }),
    ).toBeDefined();
    expect(card.getByText("Next: 28 Dec to 29 Dec")).toBeDefined();
    fireEvent.click(card.getByRole("button", { name: "Add paid leave" }));
    expect(onAddLeave).toHaveBeenCalledTimes(1);
  });

  it("says when nothing is planned", () => {
    render(
      <VacationCard
        rows={[{ job: job(), balance: balance() }]}
        onAddLeave={vi.fn()}
      />,
    );
    expect(screen.getByText("Nothing planned")).toBeDefined();
  });

  it("shows a compact row per job and one add action for several jobs", () => {
    render(
      <VacationCard
        rows={[
          { job: job(), balance: balance() },
          {
            job: job({ id: "job-2", name: "Shop" }),
            balance: balance({ leftMinutes: 300, entitlementMinutes: 2400 }),
            next: planned,
          },
        ]}
        onAddLeave={vi.fn()}
      />,
    );

    const list = within(
      screen.getByRole("list", { name: "Paid vacation by job" }),
    );
    const items = list.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(within(items[0]!).getByText("Cafe")).toBeDefined();
    expect(within(items[0]!).getByText("12h left of 80h")).toBeDefined();
    expect(within(items[1]!).getByText("Shop")).toBeDefined();
    expect(within(items[1]!).getByText("5h left of 40h")).toBeDefined();
    expect(within(items[1]!).getByText("Next: 28 Dec to 29 Dec")).toBeDefined();
    expect(
      screen.getAllByRole("button", { name: "Add paid leave" }),
    ).toHaveLength(1);
  });

  it("says over by in words and keeps the bar inside its box", () => {
    render(
      <VacationCard
        rows={[
          {
            job: job(),
            balance: balance({
              takenMinutes: 4800,
              plannedMinutes: 480,
              leftMinutes: -480,
            }),
          },
        ]}
        onAddLeave={vi.fn()}
      />,
    );

    expect(screen.getByText("over by 8h")).toBeDefined();
    const bar = screen.getByRole("img", {
      name: "80h taken, 8h planned, over by 8h of 80h",
    });
    const widths = [...bar.querySelectorAll<HTMLElement>("[data-segment]")].map(
      (segment) => Number.parseFloat(segment.style.width),
    );
    expect(widths.reduce((sum, width) => sum + width, 0)).toBeLessThanOrEqual(
      100.01,
    );
  });

  it("has a skeleton that says it is loading", () => {
    render(<VacationCardSkeleton />);
    expect(screen.getByText("Loading your paid vacation…")).toBeDefined();
  });

  it("uses design tokens only, no raw palette classes", () => {
    expect(source).not.toMatch(/\b(slate|indigo|red|gray|amber|teal)-\d/);
  });
});
