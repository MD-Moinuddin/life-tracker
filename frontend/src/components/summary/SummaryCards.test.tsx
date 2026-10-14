import { render, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Summary } from "../../lib/summary-api";
import { SummaryCards } from "./SummaryCards";

const summary: Summary = {
  from: "2026-10-05",
  to: "2026-10-11",
  jobs: [
    {
      jobId: "job-1",
      name: "Warehouse",
      type: "part_time",
      hourlyRate: "12.00",
      earnedMinutes: 450,
      plannedMinutes: 540,
      earnedAmount: "90.00",
      plannedAmount: "108.00",
    },
    {
      jobId: "job-2",
      name: "Cafe",
      type: "mini_job",
      hourlyRate: "13.50",
      earnedMinutes: 0,
      plannedMinutes: 270,
      earnedAmount: "0.00",
      plannedAmount: "60.75",
    },
  ],
  totals: {
    earnedMinutes: 450,
    plannedMinutes: 810,
    earnedAmount: "90.00",
    plannedAmount: "168.75",
  },
};

function renderCards(value: Summary = summary) {
  const { container } = render(<SummaryCards summary={value} />);
  return within(container);
}

function expectRow(
  scope: HTMLElement,
  label: string,
  duration: string,
  amount: string,
) {
  const value = within(scope).getByText(label).nextElementSibling;
  expect(value?.tagName).toBe("DD");
  expect(value?.textContent).toContain(duration);
  expect(value?.textContent).toContain(amount);
}

describe("SummaryCards", () => {
  it("shows earned and planned figures on the right rows of the totals card", () => {
    const view = renderCards();

    const card = view
      .getByRole("heading", { level: 2, name: "Total" })
      .closest("div") as HTMLElement;
    expectRow(card, "Earned", "7h 30m", "€90.00");
    expectRow(card, "Planned", "13h 30m", "€168.75");
    expect(within(card).getByText("56% of planned hours done")).toBeDefined();
  });

  it("gives the progress bar the same percent and the minute totals", () => {
    const view = renderCards();

    const bar = view.getByRole("progressbar", {
      name: "Planned hours finished",
    });
    expect(bar.getAttribute("aria-valuenow")).toBe("450");
    expect(bar.getAttribute("aria-valuemax")).toBe("810");
    expect(bar.getAttribute("aria-valuetext")).toBe("7h 30m of 13h 30m");
    expect(bar.firstElementChild?.getAttribute("style")).toContain("56%");
  });

  it("shows 0% rather than NaN when nothing is planned", () => {
    const view = renderCards({
      ...summary,
      totals: {
        earnedMinutes: 0,
        plannedMinutes: 0,
        earnedAmount: "0.00",
        plannedAmount: "0.00",
      },
    });

    expect(view.getByText("0% of planned hours done")).toBeDefined();
    const bar = view.getByRole("progressbar");
    expect(bar.firstElementChild?.getAttribute("style")).toContain("0%");
  });

  it("names the job list by the period", () => {
    const view = renderCards();

    expect(
      view.getByRole("list", {
        name: "Hours and earnings per job, 5 Oct to 11 Oct 2026",
      }),
    ).toBeDefined();
  });

  it("shows each job's name, type badge and four figures", () => {
    const view = renderCards();

    const item = view
      .getByRole("heading", { level: 3, name: "Cafe" })
      .closest("li") as HTMLElement;
    expect(within(item).getByText("Mini-job")).toBeDefined();
    expectRow(item, "Earned", "0m", "€0.00");
    expectRow(item, "Planned", "4h 30m", "€60.75");
  });

  it("explains earned and planned once", () => {
    const view = renderCards();

    expect(view.getAllByText(/Earned counts finished shifts/)).toHaveLength(1);
  });
});
