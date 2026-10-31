import { leave40h, noLeave } from "../../test/fixtures";
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
      leave: noLeave,
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
      leave: noLeave,
    },
  ],
  totals: {
    earnedMinutes: 480,
    plannedMinutes: 1230,
    earnedAmount: "96.00",
    plannedAmount: "252.75",
    leave: noLeave,
  },
};

describe("SummaryTable", () => {
  it("is a table with a caption naming the period", () => {
    render(<SummaryTable summary={summary} />);

    const table = screen.getByRole("table", {
      name: /Hours and earnings per job, 5 Oct to 11 Oct 2026/,
    });
    expect(table).toBeDefined();
  });

  it("has header cells for the columns", () => {
    render(<SummaryTable summary={summary} />);

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
    render(<SummaryTable summary={summary} />);

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
    render(<SummaryTable summary={summary} />);

    const row = screen.getByRole("row", { name: /Total/ });
    const cells = within(row).getAllByRole("cell");

    expect(cells.map((cell) => cell.textContent)).toEqual([
      "8h",
      "€96.00",
      "20h 30m",
      "€252.75",
    ]);
  });

  it("shows each job's name with its type badge", () => {
    render(<SummaryTable summary={summary} />);

    expect(screen.getByText("Part-time job").className).toContain(
      "bg-neutral-soft",
    );
    expect(screen.getByText("Mini-job").className).toContain("bg-accent-soft");
    expect(screen.getByRole("rowheader", { name: /Warehouse/ })).toBeDefined();
  });

  it("is built on the shared table with no raw palette colours", () => {
    const { container } = render(<SummaryTable summary={summary} />);

    expect(container.firstElementChild?.className).toContain("rounded-card");
    expect(container.innerHTML).not.toMatch(/slate-|indigo-|red-/);
  });

  it("keeps the total row's label as strong as its numbers", () => {
    render(<SummaryTable summary={summary} />);

    const total = screen.getByRole("rowheader", { name: "Total" });
    expect(total.className).not.toContain("font-medium");
    expect(total.closest("tfoot")).not.toBeNull();
    expect(total.closest("table")?.className).toContain(
      "[&_tfoot]:font-semibold",
    );
  });

  describe("with paid leave", () => {
    const withLeave: Summary = {
      ...summary,
      jobs: [
        {
          ...(summary.jobs[0] as Summary["jobs"][number]),
          earnedMinutes: 2160,
          plannedMinutes: 2160,
          earnedAmount: "504.00",
          plannedAmount: "504.00",
          leave: leave40h,
        },
        summary.jobs[1] as Summary["jobs"][number],
      ],
      totals: {
        earnedMinutes: 2160,
        plannedMinutes: 2430,
        earnedAmount: "504.00",
        plannedAmount: "564.75",
        leave: leave40h,
      },
    };

    it("adds the Paid leave hours and amount columns", () => {
      render(<SummaryTable summary={withLeave} />);

      for (const name of ["Paid leave taken (hours)", "Paid leave taken"]) {
        expect(screen.getByRole("columnheader", { name })).toBeDefined();
      }
    });

    it("puts leave into the earned and planned columns and totals", () => {
      render(<SummaryTable summary={withLeave} />);

      const row = within(screen.getByRole("row", { name: /Warehouse/ }));
      expect(row.getAllByRole("cell").map((cell) => cell.textContent)).toEqual([
        "76h",
        "€1,064.00",
        "40h",
        "€560.00",
        "76h",
        "€1,064.00",
      ]);
      const total = within(screen.getByRole("row", { name: /Total/ }));
      expect(
        total.getAllByRole("cell").map((cell) => cell.textContent),
      ).toEqual(["76h", "€1,064.00", "40h", "€560.00", "80h 30m", "€1,124.75"]);
    });

    it("shows zeros for a job without leave", () => {
      render(<SummaryTable summary={withLeave} />);

      const row = within(screen.getByRole("row", { name: /Cafe/ }));
      expect(row.getAllByRole("cell").map((cell) => cell.textContent)).toEqual([
        "0m",
        "€0.00",
        "0m",
        "€0.00",
        "4h 30m",
        "€60.75",
      ]);
    });

    it("says in the caption that earned and planned include leave", () => {
      render(<SummaryTable summary={withLeave} />);

      expect(
        screen.getByRole("table", { name: /include paid leave/ }),
      ).toBeDefined();
    });

    it("has no leave columns without leave", () => {
      render(<SummaryTable summary={summary} />);

      expect(
        screen.queryByRole("columnheader", { name: "Paid leave taken" }),
      ).toBeNull();
      expect(screen.getAllByRole("columnheader")).toHaveLength(5);
    });
  });
});
