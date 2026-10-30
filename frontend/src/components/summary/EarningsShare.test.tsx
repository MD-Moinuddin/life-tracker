import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { SummaryJob } from "../../lib/summary-api";
import { EarningsShare } from "./EarningsShare";

function job(jobId: string, name: string, earnedAmount: string): SummaryJob {
  return {
    jobId,
    name,
    type: "part_time",
    hourlyRate: "14.00",
    earnedMinutes: 360,
    plannedMinutes: 600,
    earnedAmount,
    plannedAmount: "200.00",
  };
}

describe("EarningsShare", () => {
  it("describes the split in words and in a legend", () => {
    render(
      <EarningsShare
        jobs={[job("a", "Cafe", "84.00"), job("b", "Restaurant", "90.00")]}
      />,
    );

    expect(
      screen.getByRole("img", {
        name: "Share of earnings: Cafe 48%, Restaurant 52%",
      }),
    ).toBeDefined();
    const legend = screen.getByRole("list");
    expect(within(legend).getByText("Cafe")).toBeDefined();
    expect(within(legend).getByText("48%")).toBeDefined();
    expect(within(legend).getByText("52%")).toBeDefined();
  });

  it("sizes each part of the bar by its share", () => {
    render(
      <EarningsShare
        jobs={[job("a", "Cafe", "75.00"), job("b", "Restaurant", "25.00")]}
      />,
    );

    const bar = screen.getByRole("img");
    const widths = Array.from(bar.children).map(
      (part) => (part as HTMLElement).style.width,
    );
    expect(widths).toEqual(["75%", "25%"]);
  });

  it("renders nothing until something has been earned", () => {
    const { container } = render(
      <EarningsShare
        jobs={[job("a", "Cafe", "0.00"), job("b", "Restaurant", "0.00")]}
      />,
    );

    expect(container.innerHTML).toBe("");
  });
});
