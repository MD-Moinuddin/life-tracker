import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { VacationBalance } from "../../lib/vacation";
import { VacationBalanceCard } from "./VacationBalanceCard";
import source from "./VacationBalanceCard.tsx?raw";

const mockup: VacationBalance = {
  entitlementMinutes: 4800,
  carriedOverMinutes: 0,
  takenMinutes: 3600,
  plannedMinutes: 480,
  leftMinutes: 720,
};

// The visible length of a ring arc: the first number of its dash pattern.
function arc(ring: HTMLElement, name: string) {
  const dash = ring
    .querySelector(`[data-segment=${name}]`)
    ?.getAttribute("stroke-dasharray");
  return parseFloat(dash?.split(" ")[0] ?? "NaN");
}

function renderCard(balance: Partial<VacationBalance> = {}) {
  render(<VacationBalanceCard balance={{ ...mockup, ...balance }} />);
  return within(screen.getByRole("region", { name: "Paid vacation balance" }));
}

describe("VacationBalanceCard", () => {
  it("names the figures: taken, planned and left of the allowance", () => {
    const card = renderCard();

    expect(card.getByText("Taken").parentElement?.textContent).toContain("60h");
    expect(card.getByText("Planned").parentElement?.textContent).toContain(
      "8h",
    );
    expect(card.getByText("Left").parentElement?.textContent).toContain("12h");
    expect(card.getByText("of 80h")).toBeDefined();
  });

  it("describes the bar in words", () => {
    renderCard();

    expect(screen.getByRole("img", { name: "12h left of 80h" })).toBeDefined();
  });

  it("draws taken and planned as arcs of the ring, sized by the figures", () => {
    renderCard();

    const ring = screen.getByRole("img", { name: "12h left of 80h" });
    const circumference = 2 * Math.PI * 62;
    expect(arc(ring, "taken")).toBeCloseTo(0.75 * circumference, 1);
    expect(arc(ring, "planned")).toBeCloseTo(0.1 * circumference, 1);
    expect(ring.querySelector("svg")).not.toBeNull();
  });

  it("shows the hours left in the middle, hidden from assistive tech", () => {
    renderCard();

    const centre = screen.getByText("left of 80h");
    expect(centre.closest("[aria-hidden=true]")).not.toBeNull();
    expect(centre.parentElement?.textContent).toContain("12h");
  });

  it("writes hours and minutes", () => {
    const card = renderCard({
      takenMinutes: 450,
      plannedMinutes: 0,
      leftMinutes: 4350,
    });

    expect(card.getByText("Taken").parentElement?.textContent).toContain(
      "7h 30m",
    );
    expect(card.getByText("Left").parentElement?.textContent).toContain(
      "72h 30m",
    );
  });

  it("says so in words, with a minus sign, when more is booked than allowed", () => {
    const card = renderCard({
      takenMinutes: 4800,
      plannedMinutes: 480,
      leftMinutes: -480,
    });

    expect(card.getByText("Left").parentElement?.textContent).toContain("−8h");
    const note = card.getByText("You are over by 8h.");
    expect(note.parentElement?.className).toContain("bg-warning-soft");
    expect(
      screen.getByRole("img", { name: "Over by 8h of 80h" }),
    ).toBeDefined();
  });

  it("never lets an over-booked year run past the ring", () => {
    renderCard({
      takenMinutes: 4800,
      plannedMinutes: 480,
      leftMinutes: -480,
    });

    const ring = screen.getByRole("img", { name: "Over by 8h of 80h" });
    const circumference = 2 * Math.PI * 62;
    expect(arc(ring, "taken") + arc(ring, "planned")).toBeCloseTo(
      circumference,
      1,
    );
  });

  it("draws an empty ring, with no NaN, when there is no allowance", () => {
    renderCard({
      entitlementMinutes: 0,
      takenMinutes: 0,
      plannedMinutes: 0,
      leftMinutes: 0,
    });

    const ring = screen.getByRole("img", { name: "0m left of 0m" });
    expect(ring.outerHTML).not.toContain("NaN");
    expect(arc(ring, "taken")).toBe(0);
  });

  it("mentions carried-over hours only when there are some", () => {
    const without = renderCard();
    expect(without.queryByText(/carried over/)).toBeNull();
  });

  it("includes the carry-over in the allowance and names where it came from", () => {
    const card = renderCard({
      entitlementMinutes: 4800,
      carriedOverMinutes: 480,
      leftMinutes: 1200,
    });

    expect(
      card.getByText("8h from last year expire on 31 March."),
    ).toBeDefined();
    expect(card.getByText("of 88h")).toBeDefined();
  });

  it("uses design tokens only, no raw palette classes", () => {
    expect(source).not.toMatch(/\b(slate|indigo|red|gray|amber|teal)-\d/);
  });
});
