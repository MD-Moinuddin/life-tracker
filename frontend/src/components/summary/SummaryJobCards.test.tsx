import { leave40h, noLeave } from "../../test/fixtures";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { jobColor } from "../../lib/job-color";
import type { Summary, SummaryJob } from "../../lib/summary-api";
import { SummaryJobCards } from "./SummaryJobCards";
import source from "./SummaryJobCards.tsx?raw";

const cafe: SummaryJob = {
  jobId: "job-1",
  name: "Cafe",
  type: "part_time",
  hourlyRate: "14.00",
  earnedMinutes: 360,
  plannedMinutes: 1035,
  earnedAmount: "84.00",
  plannedAmount: "241.50",
  leave: noLeave,
};
const restaurant: SummaryJob = {
  jobId: "job-2",
  name: "Restaurant",
  type: "mini_job",
  hourlyRate: "15.00",
  earnedMinutes: 360,
  plannedMinutes: 1230,
  earnedAmount: "90.00",
  plannedAmount: "307.50",
  leave: noLeave,
};

function summaryOf(...jobs: SummaryJob[]): Summary {
  return {
    from: "2026-10-26",
    to: "2026-11-01",
    jobs,
    totals: {
      earnedMinutes: 720,
      plannedMinutes: 2265,
      earnedAmount: "174.00",
      plannedAmount: "549.00",
      leave: noLeave,
    },
  };
}

describe("SummaryJobCards", () => {
  it("shows a labelled card per job with earned and planned figures", () => {
    render(<SummaryJobCards summary={summaryOf(cafe, restaurant)} />);

    const list = screen.getByRole("list", {
      name: "Earnings by job, 26 Oct to 1 Nov 2026",
    });
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    const first = within(items[0] as HTMLElement);
    expect(first.getByText("Cafe")).toBeDefined();
    expect(first.getByText("€84.00")).toBeDefined();
    expect(first.getByText("€241.50")).toBeDefined();
    expect(first.getByText("17h 15m")).toBeDefined();
    expect(first.getByText("35% of planned hours done")).toBeDefined();
    expect(first.getByText("48% of your earnings")).toBeDefined();
  });

  it("gives each card its job colour as the left edge", () => {
    render(<SummaryJobCards summary={summaryOf(cafe)} />);

    const card = screen.getByRole("listitem").firstElementChild;
    expect(card?.className).toContain(jobColor("job-1").edge);
  });

  it("shows the type badges only when the jobs differ in type", () => {
    const { unmount } = render(
      <SummaryJobCards summary={summaryOf(cafe, restaurant)} />,
    );
    expect(screen.getByText("Mini-job")).toBeDefined();
    expect(screen.getByText("Part-time job")).toBeDefined();
    unmount();

    render(
      <SummaryJobCards
        summary={summaryOf(cafe, { ...restaurant, type: "part_time" })}
      />,
    );
    expect(screen.queryByText("Part-time job")).toBeNull();
  });

  it("names each progress bar after its job", () => {
    render(<SummaryJobCards summary={summaryOf(cafe)} />);

    expect(
      screen
        .getByRole("progressbar", { name: "Cafe planned hours finished" })
        .getAttribute("aria-valuetext"),
    ).toBe("6h of 17h 15m");
  });

  describe("with paid leave", () => {
    const cafeWithLeave: SummaryJob = {
      ...cafe,
      earnedMinutes: 2160,
      plannedMinutes: 2160,
      earnedAmount: "504.00",
      plannedAmount: "504.00",
      leave: leave40h,
    };

    it("shows the leave box with the sun, the words, the amount and the hours", () => {
      render(
        <SummaryJobCards summary={summaryOf(cafeWithLeave, restaurant)} />,
      );

      const items = screen.getAllByRole("listitem");
      const box = within(
        within(items[0] as HTMLElement).getByRole("group", {
          name: "Paid leave",
        }),
      );
      expect(box.getByText("Paid leave")).toBeDefined();
      expect(box.getByText("€560.00")).toBeDefined();
      expect(box.getByText("40h taken")).toBeDefined();
      expect(
        screen.getByRole("group", { name: "Paid leave" }).querySelector("svg"),
      ).not.toBeNull();
    });

    it("shows no leave box on a job without leave", () => {
      render(
        <SummaryJobCards summary={summaryOf(cafeWithLeave, restaurant)} />,
      );

      const items = screen.getAllByRole("listitem");
      expect(
        within(items[1] as HTMLElement).queryByText("Paid leave"),
      ).toBeNull();
    });

    it("labels worked pay as Worked and plans leave with it", () => {
      render(<SummaryJobCards summary={summaryOf(cafeWithLeave)} />);

      const card = within(screen.getByRole("listitem"));
      expect(card.getByText("Worked")).toBeDefined();
      expect(card.getByText("€504.00")).toBeDefined();
      expect(card.getByText("€1,064.00")).toBeDefined();
      expect(card.getByText("76h")).toBeDefined();
    });

    it("shows what is still planned when only part of the leave is taken", () => {
      render(
        <SummaryJobCards
          summary={summaryOf({
            ...cafeWithLeave,
            leave: {
              earnedMinutes: 480,
              plannedMinutes: 2400,
              earnedAmount: "112.00",
              plannedAmount: "560.00",
            },
          })}
        />,
      );

      const box = within(screen.getByRole("group", { name: "Paid leave" }));
      expect(box.getByText("8h taken of 40h")).toBeDefined();
      expect(box.queryByText(/planned/)).toBeNull();
    });

    it("counts leave in the earnings share, so shares add up to 100", () => {
      render(
        <SummaryJobCards
          summary={summaryOf(
            { ...cafeWithLeave, earnedAmount: "10.00" },
            { ...restaurant, earnedAmount: "1054.00" },
          )}
        />,
      );

      const items = screen.getAllByRole("listitem");
      expect(
        within(items[0] as HTMLElement).getByText("35% of your earnings"),
      ).toBeDefined();
      expect(
        within(items[1] as HTMLElement).getByText("65% of your earnings"),
      ).toBeDefined();
    });

    it("colours the leave label without an important utility", () => {
      expect(source).not.toMatch(/["`\s]![a-z]/);
    });

    it("uses only design tokens", () => {
      const { container } = render(
        <SummaryJobCards summary={summaryOf(cafeWithLeave)} />,
      );

      expect(container.innerHTML).not.toMatch(/slate-|indigo-|red-/);
    });
  });
});
