import { describe, expect, it } from "vitest";
import { makeShift } from "../../test/fixtures";
import type { Shift } from "../shifts-api";
import { buildDemoSummary } from "./demo-summary";

function shift(overrides: Partial<Shift> & { rate?: string }): Shift {
  const { rate, ...rest } = overrides;
  const base = makeShift(rest);
  return {
    ...base,
    job: { ...base.job, hourlyRate: rate ?? base.job.hourlyRate },
  };
}

const NOW = "2026-10-07T12:00";

describe("buildDemoSummary", () => {
  it("covers the Monday to Sunday week of the date for a week", () => {
    const summary = buildDemoSummary({
      shifts: [],
      range: "week",
      date: "2026-10-07",
      now: NOW,
    });

    expect(summary.from).toBe("2026-10-05");
    expect(summary.to).toBe("2026-10-11");
  });

  it("covers the whole calendar month for a month, including a short February", () => {
    const month = buildDemoSummary({
      shifts: [],
      range: "month",
      date: "2026-10-07",
      now: NOW,
    });
    const february = buildDemoSummary({
      shifts: [],
      range: "month",
      date: "2027-02-10",
      now: NOW,
    });

    expect([month.from, month.to]).toEqual(["2026-10-01", "2026-10-31"]);
    expect([february.from, february.to]).toEqual(["2027-02-01", "2027-02-28"]);
  });

  it("counts finished shifts as earned and every shift as planned", () => {
    const summary = buildDemoSummary({
      shifts: [
        shift({ id: "done", date: "2026-10-05", workedMinutes: 480 }),
        shift({ id: "later", date: "2026-10-09", workedMinutes: 240 }),
      ],
      range: "week",
      date: "2026-10-07",
      now: NOW,
    });

    expect(summary.totals).toEqual({
      earnedMinutes: 480,
      plannedMinutes: 720,
      earnedAmount: "96.00",
      plannedAmount: "144.00",
    });
  });

  it("does not count a shift that ends after now as earned, even if it started", () => {
    const summary = buildDemoSummary({
      shifts: [
        shift({
          date: "2026-10-07",
          startTime: "09:00",
          endTime: "17:00",
          workedMinutes: 480,
        }),
      ],
      range: "week",
      date: "2026-10-07",
      now: "2026-10-07T12:00",
    });

    expect(summary.totals.earnedMinutes).toBe(0);
    expect(summary.totals.plannedMinutes).toBe(480);
  });

  it("leaves out shifts outside the period", () => {
    const summary = buildDemoSummary({
      shifts: [
        shift({ date: "2026-10-04" }),
        shift({ date: "2026-10-12" }),
        shift({ date: "2026-10-06" }),
      ],
      range: "week",
      date: "2026-10-07",
      now: NOW,
    });

    expect(summary.jobs[0]?.plannedMinutes).toBe(480);
  });

  it("groups by job and sorts the jobs by name", () => {
    const warehouse = shift({ id: "a", jobId: "job-1", date: "2026-10-06" });
    const cafe = shift({
      id: "b",
      jobId: "job-2",
      date: "2026-10-06",
      job: { id: "job-2", name: "Cafe", hourlyRate: "10.00", type: "mini_job" },
    });
    const summary = buildDemoSummary({
      shifts: [warehouse, cafe, { ...warehouse, id: "c" }],
      range: "week",
      date: "2026-10-07",
      now: NOW,
    });

    expect(summary.jobs.map((job) => job.name)).toEqual(["Cafe", "Warehouse"]);
    expect(summary.jobs[1]?.plannedMinutes).toBe(960);
  });

  it("rounds each job's amount half up to the cent, like the backend", () => {
    const summary = buildDemoSummary({
      shifts: [shift({ date: "2026-10-06", rate: "10.01", workedMinutes: 30 })],
      range: "week",
      date: "2026-10-07",
      now: NOW,
    });

    expect(summary.jobs[0]?.plannedAmount).toBe("5.01");
  });

  it("sums the rounded job amounts for the totals", () => {
    const summary = buildDemoSummary({
      shifts: [
        shift({
          id: "a",
          jobId: "job-1",
          date: "2026-10-06",
          workedMinutes: 30,
          rate: "10.01",
        }),
        shift({
          id: "b",
          jobId: "job-2",
          date: "2026-10-06",
          workedMinutes: 30,
          job: {
            id: "job-2",
            name: "Cafe",
            hourlyRate: "10.01",
            type: "part_time",
          },
        }),
      ],
      range: "week",
      date: "2026-10-07",
      now: NOW,
    });

    expect(summary.totals.plannedAmount).toBe("10.02");
  });

  it("has no mini-job data for a week", () => {
    const summary = buildDemoSummary({
      shifts: [],
      range: "week",
      date: "2026-10-07",
      now: NOW,
    });

    expect(summary.miniJob).toBeUndefined();
  });

  it("measures a month's planned mini-job earnings against the €540 limit", () => {
    const mini = (id: string, minutes: number) =>
      shift({
        id,
        date: "2026-10-06",
        workedMinutes: minutes,
        job: {
          id: "job-m",
          name: "Mini",
          hourlyRate: "15.00",
          type: "mini_job",
        },
        jobId: "job-m",
      });
    const under = buildDemoSummary({
      shifts: [mini("a", 36 * 60)],
      range: "month",
      date: "2026-10-07",
      now: NOW,
    });
    const over = buildDemoSummary({
      shifts: [mini("a", 36 * 60 + 60)],
      range: "month",
      date: "2026-10-07",
      now: NOW,
    });

    expect(under.miniJob).toEqual({
      plannedAmount: "540.00",
      threshold: "540.00",
      warning: false,
    });
    expect(over.miniJob?.warning).toBe(true);
  });

  it("does not count part-time earnings towards the mini-job limit", () => {
    const summary = buildDemoSummary({
      shifts: [shift({ date: "2026-10-06", workedMinutes: 100 * 60 })],
      range: "month",
      date: "2026-10-07",
      now: NOW,
    });

    expect(summary.miniJob?.plannedAmount).toBe("0.00");
    expect(summary.miniJob?.warning).toBe(false);
  });
});
