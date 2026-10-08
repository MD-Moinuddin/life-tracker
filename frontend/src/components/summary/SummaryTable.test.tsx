import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Summary } from "../../lib/summary-api";
import { SummaryTable } from "./SummaryTable";

const summary: Summary = {
  from: "2026-10-05",
  to: "2026-10-11",
  jobs: [
    {
      jobId: "job-1",
      name: "Warehouse",
      type: "part_time",
      hourlyRate: "12.00",
      earnedMinutes: 480,
      plannedMinutes: 960,
      earnedAmount: "96.00",
      plannedAmount: "192.00",
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
    earnedMinutes: 480,
    plannedMinutes: 1230,
    earnedAmount: "96.00",
    plannedAmount: "252.75",
  },
};

describe("SummaryTable", () => {
  it("is a table with a caption naming the period", () => {
    render(
      <SummaryTable summary={summary} periodLabel="5 Oct to 11 Oct 2026" />,
    );

    const table = screen.getByRole("table", {
      name: /Hours and earnings per job, 5 Oct to 11 Oct 2026/,
    });
    expect(table).toBeDefined();
  });

  it("has header cells for the columns", () => {
    render(<SummaryTable summary={summary} periodLabel="x" />);

    for (const name of [
      "Job",
      "Earned hours",
      "Earned",
      "Planned hours",
      "Planned",
    ]) {
      expect(screen.getByRole("columnheader", { name })).toBeDefined();
    }
  });

  it("shows earned and planned hours and euros for each job", () => {
    render(<SummaryTable summary={summary} periodLabel="x" />);

    const row = screen.getByRole("row", { name: /Cafe/ });
    const cells = within(row).getAllByRole("cell");

    expect(cells.map((cell) => cell.textContent)).toEqual([
      "0m",
      "€0.00",
      "4h 30m",
      "€60.75",
    ]);
  });

  it("shows the totals in the last row", () => {
    render(<SummaryTable summary={summary} periodLabel="x" />);

    const row = screen.getByRole("row", { name: /Total/ });
    const cells = within(row).getAllByRole("cell");

    expect(cells.map((cell) => cell.textContent)).toEqual([
      "8h",
      "€96.00",
      "20h 30m",
      "€252.75",
    ]);
  });
});
