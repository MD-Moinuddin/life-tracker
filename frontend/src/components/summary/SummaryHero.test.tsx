import { leave40h, noLeave } from "../../test/fixtures";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SummaryHero } from "./SummaryHero";
import source from "./SummaryHero.tsx?raw";

describe("SummaryHero", () => {
  it("shows earned, planned and progress", () => {
    render(
      <SummaryHero
        totals={{
          earnedMinutes: 720,
          plannedMinutes: 2265,
          earnedAmount: "174.00",
          plannedAmount: "549.00",
          leave: noLeave,
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
          leave: noLeave,
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
          leave: noLeave,
        }}
      />,
    );

    expect(screen.getByText("0%")).toBeDefined();
  });

  describe("with paid leave", () => {
    const withLeave = {
      earnedMinutes: 2160,
      plannedMinutes: 4320,
      earnedAmount: "504.00",
      plannedAmount: "1008.00",
      leave: leave40h,
    };

    it("adds earned leave to Earned and says how it is made up", () => {
      render(<SummaryHero totals={withLeave} />);

      const totals = screen.getByRole("region", { name: "Totals" });
      expect(within(totals).getByText("€1,064.00")).toBeDefined();
      expect(
        within(totals).getByText("worked €504.00 + paid leave €560.00"),
      ).toBeDefined();
      expect(within(totals).queryByText("36h finished")).toBeNull();
    });

    it("plans worked and leave together", () => {
      render(<SummaryHero totals={withLeave} />);

      const totals = screen.getByRole("region", { name: "Totals" });
      expect(within(totals).getByText("€1,568.00")).toBeDefined();
      expect(within(totals).getByText("112h scheduled")).toBeDefined();
    });

    it("adds a Paid leave stat with the hours taken", () => {
      render(<SummaryHero totals={withLeave} />);

      const totals = screen.getByRole("region", { name: "Totals" });
      expect(within(totals).getByText("Paid leave")).toBeDefined();
      expect(within(totals).getByText("€560.00")).toBeDefined();
      expect(within(totals).getByText("40h taken")).toBeDefined();
    });

    it("puts the sun next to the words Paid leave", () => {
      render(<SummaryHero totals={withLeave} />);

      const label = screen.getByText("Paid leave");
      expect(label.querySelector("svg")).not.toBeNull();
      expect(label.textContent).toBe("Paid leave");
    });

    it("writes every class string out in full", () => {
      expect(source).not.toMatch(/\.replace\(/);
      expect(source).not.toMatch(/["`\s]![a-z]/);
    });

    it("keeps progress on worked hours against planned worked hours", () => {
      render(<SummaryHero totals={withLeave} />);

      expect(screen.getByText("50%")).toBeDefined();
      expect(
        screen
          .getByRole("progressbar", { name: "Planned hours finished" })
          .getAttribute("aria-valuetext"),
      ).toBe("36h of 72h");
    });

    it("shows no Paid leave stat when none is planned", () => {
      render(<SummaryHero totals={{ ...withLeave, leave: noLeave }} />);

      expect(screen.queryByText("Paid leave")).toBeNull();
      expect(screen.getByText("36h finished")).toBeDefined();
    });

    it("shows the stat for leave that is only planned, with zero taken", () => {
      render(
        <SummaryHero
          totals={{
            ...withLeave,
            leave: { ...leave40h, earnedMinutes: 0, earnedAmount: "0.00" },
          }}
        />,
      );

      expect(screen.getByText("Paid leave")).toBeDefined();
      expect(screen.getByText("0m taken")).toBeDefined();
      expect(
        screen.getByText("worked €504.00 + paid leave €0.00"),
      ).toBeDefined();
    });

    it("uses only design tokens", () => {
      const { container } = render(<SummaryHero totals={withLeave} />);

      expect(container.innerHTML).not.toMatch(/slate-|indigo-|red-/);
    });
  });
});
