import { describe, expect, it } from "vitest";
import { makeLeave, makeShift, noLeave } from "../../test/fixtures";
import type { Leave } from "../leave-api";
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
      leave: noLeave,
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

  it("reports zero paid leave on every job and in the totals without leave", () => {
    const summary = buildDemoSummary({
      shifts: [shift({ date: "2026-10-06" })],
      range: "month",
      date: "2026-10-07",
      now: NOW,
    });

    expect(summary.jobs).toHaveLength(1);
    expect(summary.jobs[0]?.leave).toEqual(noLeave);
    expect(summary.totals.leave).toEqual(noLeave);
  });
});

// A job as the Summary sees it, and a leave entry of it.
function job(name: string, hourlyRate: string, type: Shift["job"]["type"]) {
  return { id: `job-${name}`, name, hourlyRate, type };
}

function leaveOf(
  of: ReturnType<typeof job>,
  overrides: Partial<Leave> = {},
): Leave {
  return makeLeave({
    id: `leave-${of.name}-${overrides.startDate ?? ""}`,
    jobId: of.id,
    job: of,
    ...overrides,
  });
}

function shiftOf(
  of: ReturnType<typeof job>,
  date: string,
  startTime: string,
  endTime: string,
  workedMinutes: number,
): Shift {
  return makeShift({
    id: `shift-${of.name}-${date}`,
    jobId: of.id,
    job: of,
    date,
    startTime,
    endTime,
    endDate: date,
    workedMinutes,
  });
}

// Monday 26 to Friday 30 October 2026, 4 hours a day.
const lastWeekOfOctober = {
  startDate: "2026-10-26",
  endDate: "2026-10-30",
  weekdays: [1, 2, 3, 4, 5],
  minutesPerDay: 240,
};

const week = {
  range: "week" as const,
  date: "2026-10-28",
  now: "2026-10-28T12:00",
};

// The backend's example cases for paid leave in the Summary, with the same
// numbers. Keep these in step with describe("paid leave") in
// backend/tests/integration/summary.integration.test.ts: a change there is a
// change here.
describe("buildDemoSummary, paid leave", () => {
  it("counts leave days before today as earned and the rest as planned, apart from the worked figures", () => {
    const cafe = job("Cafe", "14.00", "part_time");
    const shifts = [
      shiftOf(cafe, "2026-10-27", "09:00", "13:00", 240),
      shiftOf(cafe, "2026-10-31", "10:00", "14:00", 240),
    ];
    const before = buildDemoSummary({ shifts, ...week });

    const summary = buildDemoSummary({
      shifts,
      leave: [leaveOf(cafe, lastWeekOfOctober)],
      ...week,
    });

    const expectedLeave = {
      earnedMinutes: 480,
      plannedMinutes: 1200,
      earnedAmount: "112.00",
      plannedAmount: "280.00",
    };
    expect(summary.jobs).toEqual([
      {
        jobId: cafe.id,
        name: "Cafe",
        type: "part_time",
        hourlyRate: "14.00",
        earnedMinutes: 240,
        plannedMinutes: 480,
        earnedAmount: "56.00",
        plannedAmount: "112.00",
        leave: expectedLeave,
      },
    ]);
    expect(summary.totals).toEqual({
      earnedMinutes: 240,
      plannedMinutes: 480,
      earnedAmount: "56.00",
      plannedAmount: "112.00",
      leave: expectedLeave,
    });
    expect({ ...summary.totals, leave: noLeave }).toEqual(before.totals);
  });

  it("gives a job with leave but no shifts a row, in name order", () => {
    const archive = job("Archive", "10.00", "part_time");
    const bakery = job("Bakery", "12.50", "mini_job");
    const cafe = job("Cafe", "10.00", "part_time");

    const summary = buildDemoSummary({
      shifts: [
        shiftOf(archive, "2026-10-26", "09:00", "10:00", 60),
        shiftOf(cafe, "2026-10-26", "09:00", "11:00", 120),
      ],
      leave: [leaveOf(bakery, { ...lastWeekOfOctober, weekdays: [5] })],
      ...week,
    });

    expect(summary.jobs.map((row) => row.name)).toEqual([
      "Archive",
      "Bakery",
      "Cafe",
    ]);
    const bakeryLeave = {
      earnedMinutes: 0,
      plannedMinutes: 240,
      earnedAmount: "0.00",
      plannedAmount: "50.00",
    };
    expect(summary.jobs[1]).toEqual({
      jobId: bakery.id,
      name: "Bakery",
      type: "mini_job",
      hourlyRate: "12.50",
      earnedMinutes: 0,
      plannedMinutes: 0,
      earnedAmount: "0.00",
      plannedAmount: "0.00",
      leave: bakeryLeave,
    });
    expect(summary.totals.leave).toEqual(bakeryLeave);
  });

  it("counts only the days inside the month for leave that crosses a month end", () => {
    const cafe = job("Cafe", "14.00", "part_time");
    // Thursday 29 October to Tuesday 3 November.
    const leave = [
      leaveOf(cafe, {
        ...lastWeekOfOctober,
        startDate: "2026-10-29",
        endDate: "2026-11-03",
      }),
    ];
    const month = (date: string) =>
      buildDemoSummary({
        shifts: [],
        leave,
        range: "month",
        date,
        now: "2026-11-03T08:00",
      });

    expect(month("2026-11-10").jobs[0]?.leave).toEqual({
      earnedMinutes: 240,
      plannedMinutes: 480,
      earnedAmount: "56.00",
      plannedAmount: "112.00",
    });
    expect(month("2026-10-10").jobs[0]?.leave).toEqual({
      earnedMinutes: 480,
      plannedMinutes: 480,
      earnedAmount: "112.00",
      plannedAmount: "112.00",
    });
  });

  it("adds a mini-job's planned leave to the mini-job limit, but not a part-time job's", () => {
    const cafe = job("Cafe", "10.00", "mini_job");
    const warehouse = job("Warehouse", "12.00", "part_time");
    const shifts = ["2026-12-01", "2026-12-02", "2026-12-03"].map((date) =>
      shiftOf(cafe, date, "00:00", "18:00", 1080),
    );
    // Monday 14 to Friday 18 December, 8 hours a day: 480.00 of leave.
    const warehouseLeave = leaveOf(warehouse, {
      startDate: "2026-12-14",
      endDate: "2026-12-18",
      weekdays: [1, 2, 3, 4, 5],
      minutesPerDay: 480,
    });
    // Monday 7 December, one hour: 10.00 of leave.
    const cafeLeave = leaveOf(cafe, {
      startDate: "2026-12-07",
      endDate: "2026-12-07",
      weekdays: [1],
      minutesPerDay: 60,
    });
    const december = (leave: Leave[]) =>
      buildDemoSummary({
        shifts,
        leave,
        range: "month",
        date: "2026-12-15",
        now: "2026-12-01T00:00",
      });

    const partTimeLeaveOnly = december([warehouseLeave]);
    const withMiniJobLeave = december([warehouseLeave, cafeLeave]);

    expect(partTimeLeaveOnly.miniJob).toEqual({
      plannedAmount: "540.00",
      threshold: "540.00",
      warning: false,
    });
    expect(withMiniJobLeave.miniJob).toEqual({
      plannedAmount: "550.00",
      threshold: "540.00",
      warning: true,
    });
    expect(withMiniJobLeave.totals).toMatchObject({
      plannedAmount: "540.00",
      leave: { plannedMinutes: 2460, plannedAmount: "490.00" },
    });
  });

  it("leaves out the mini-job block for a week with leave", () => {
    const cafe = job("Cafe", "10.00", "mini_job");

    const summary = buildDemoSummary({
      shifts: [],
      leave: [leaveOf(cafe, lastWeekOfOctober)],
      ...week,
    });

    expect(summary.totals.leave.plannedAmount).toBe("200.00");
    expect(summary.miniJob).toBeUndefined();
  });

  it("returns zero leave for a period without leave", () => {
    const cafe = job("Cafe", "14.00", "part_time");

    const summary = buildDemoSummary({
      shifts: [shiftOf(cafe, "2026-11-09", "09:00", "13:00", 240)],
      leave: [leaveOf(cafe, lastWeekOfOctober)],
      range: "week",
      date: "2026-11-10",
      now: "2026-11-10T12:00",
    });

    expect(summary.jobs[0]?.leave).toEqual(noLeave);
    expect(summary.totals.leave).toEqual(noLeave);
  });
});
