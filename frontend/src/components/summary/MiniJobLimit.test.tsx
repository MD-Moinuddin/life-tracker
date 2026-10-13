import { render, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Summary } from "../../lib/summary-api";
import { MiniJobLimit } from "./MiniJobLimit";

const summary: Summary = {
  from: "2026-10-01",
  to: "2026-10-31",
  jobs: [
    {
      jobId: "job-2",
      name: "Cafe",
      type: "mini_job",
      hourlyRate: "13.50",
      earnedMinutes: 0,
      plannedMinutes: 2133,
      earnedAmount: "0.00",
      plannedAmount: "480.00",
    },
  ],
  totals: {
    earnedMinutes: 0,
    plannedMinutes: 2133,
    earnedAmount: "0.00",
    plannedAmount: "480.00",
  },
  miniJob: { plannedAmount: "480.00", threshold: "540.00", warning: false },
};

function withMiniJob(plannedAmount: string, warning: boolean): Summary {
  return {
    ...summary,
    miniJob: { plannedAmount, threshold: "540.00", warning },
  };
}

function renderLimit(value: Summary) {
  const { container } = render(<MiniJobLimit summary={value} />);
  return { container, view: within(container) };
}

describe("MiniJobLimit", () => {
  it("renders nothing without a mini-job summary (a week)", () => {
    const { container } = renderLimit({ ...summary, miniJob: undefined });

    expect(container.innerHTML).toBe("");
  });

  it("renders nothing when the month has no mini-job", () => {
    const { container } = renderLimit({
      ...summary,
      jobs: summary.jobs.map((job) => ({ ...job, type: "part_time" as const })),
    });

    expect(container.innerHTML).toBe("");
  });

  it("shows the planned amount against the limit with an accent bar", () => {
    const { view } = renderLimit(summary);

    expect(view.getByText("Mini-job limit")).toBeDefined();
    expect(view.getByText("€480.00 of €540.00 planned")).toBeDefined();
    expect(view.queryByText(/Over the limit/)).toBeNull();
    const bar = view.getByRole("progressbar", {
      name: "Planned mini-job earnings against the monthly limit",
    });
    expect(bar.getAttribute("aria-valuenow")).toBe("480");
    expect(bar.getAttribute("aria-valuemax")).toBe("540");
    expect(bar.getAttribute("aria-valuetext")).toBe("€480.00 of €540.00");
    const fill = bar.firstElementChild as HTMLElement;
    expect(fill.getAttribute("style")).toContain("89%");
    expect(fill.className).toContain("bg-accent");
    expect(fill.className).not.toContain("bg-warning");
  });

  it("says Over the limit in words and fills a warning bar when over", () => {
    const { view } = renderLimit(withMiniJob("600.00", true));

    expect(view.getByText(/€600.00 of €540.00 planned/)).toBeDefined();
    expect(view.getByText(/Over the limit/)).toBeDefined();
    const bar = view.getByRole("progressbar");
    expect(bar.getAttribute("aria-valuenow")).toBe("540");
    expect(bar.getAttribute("aria-valuetext")).toBe("€600.00 of €540.00");
    const fill = bar.firstElementChild as HTMLElement;
    expect(fill.getAttribute("style")).toContain("100%");
    expect(fill.className).toContain("bg-warning");
    expect(fill.className).not.toContain("bg-accent");
  });

  it("trusts the API: exactly at the limit is full but not a warning", () => {
    const { view } = renderLimit(withMiniJob("540.00", false));

    expect(view.queryByText(/Over the limit/)).toBeNull();
    const bar = view.getByRole("progressbar");
    expect(bar.getAttribute("aria-valuenow")).toBe("540");
    const fill = bar.firstElementChild as HTMLElement;
    expect(fill.getAttribute("style")).toContain("100%");
    expect(fill.className).toContain("bg-accent");
  });
});
