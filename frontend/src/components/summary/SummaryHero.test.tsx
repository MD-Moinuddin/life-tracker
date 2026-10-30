import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SummaryHero } from "./SummaryHero";

describe("SummaryHero", () => {
  it("shows earned, planned and progress", () => {
    render(
      <SummaryHero
        totals={{
          earnedMinutes: 720,
          plannedMinutes: 2265,
          earnedAmount: "174.00",
          plannedAmount: "549.00",
        }}
      />,
    );

    const totals = screen.getByRole("region", { name: "Totals" });
    expect(within(totals).getByText("€174.00")).toBeDefined();
    expect(within(totals).getByText("12h finished")).toBeDefined();
    expect(within(totals).getByText("€549.00")).toBeDefined();
    expect(within(totals).getByText("37h 45m scheduled")).toBeDefined();
    expect(within(totals).getByText("32%")).toBeDefined();
  });

  it("reads the progress bar as hours done of hours planned", () => {
    render(
      <SummaryHero
        totals={{
          earnedMinutes: 720,
          plannedMinutes: 2265,
          earnedAmount: "174.00",
          plannedAmount: "549.00",
        }}
      />,
    );

    const bar = screen.getByRole("progressbar", {
      name: "Planned hours finished",
    });
    expect(bar.getAttribute("aria-valuetext")).toBe("12h of 37h 45m");
  });

  it("shows 0% when nothing is planned", () => {
    render(
      <SummaryHero
        totals={{
          earnedMinutes: 0,
          plannedMinutes: 0,
          earnedAmount: "0.00",
          plannedAmount: "0.00",
        }}
      />,
    );

    expect(screen.getByText("0%")).toBeDefined();
  });
});
