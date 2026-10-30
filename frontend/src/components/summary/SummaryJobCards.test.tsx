import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { jobColor } from "../../lib/job-color";
import type { Summary, SummaryJob } from "../../lib/summary-api";
import { SummaryJobCards } from "./SummaryJobCards";

const cafe: SummaryJob = {
  jobId: "job-1",
  name: "Cafe",
  type: "part_time",
  hourlyRate: "14.00",
  earnedMinutes: 360,
  plannedMinutes: 1035,
  earnedAmount: "84.00",
  plannedAmount: "241.50",
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
});
