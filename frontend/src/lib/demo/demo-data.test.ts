import { describe, expect, it } from "vitest";
import { addDays, weekBounds } from "../dates";
import { jobColor } from "../job-color";
import { countedDays } from "../leave-days";
import {
  shiftEndDate,
  shiftLengthMinutes,
  timeToMinutes,
  workedMinutes,
} from "../shift-time";
import { vacationBalance, vacationSettingOf } from "../vacation";
import { buildDemoData } from "./demo-data";
import type { DemoJob, DemoLeave } from "./demo-db";

const TODAY = "2026-10-30";

// A shift as a pair of minutes counted from the start of its first date, so
// shifts on different days can be compared.
function span(
  shift: { date: string; startTime: string; endTime: string },
  origin: string,
) {
  const dayStart =
    (new Date(`${shift.date}T00:00:00Z`).getTime() -
      new Date(`${origin}T00:00:00Z`).getTime()) /
    60_000;
  const start = dayStart + timeToMinutes(shift.startTime);
  return [start, start + shiftLengthMinutes(shift.startTime, shift.endTime)];
}

describe("buildDemoData", () => {
  const { jobs, shifts } = buildDemoData(TODAY);

  it("has two jobs: a part-time job and a mini-job, in different colours", () => {
    expect(jobs.map((job) => job.type).sort()).toEqual([
      "mini_job",
      "part_time",
    ]);
    expect(jobs.every((job) => Number(job.hourlyRate) > 0)).toBe(true);
    expect(new Set(jobs.map((job) => jobColor(job.id))).size).toBe(2);
  });

  it("covers two weeks before and two weeks after the current one", () => {
    const monday = weekBounds(TODAY).from;
    const dates = shifts.map((shift) => shift.date).sort();

    expect((dates[0] as string) >= addDays(monday, -14)).toBe(true);
    expect((dates[dates.length - 1] as string) <= addDays(monday, 27)).toBe(
      true,
    );
    expect(dates.some((date) => date < TODAY)).toBe(true);
    expect(dates.some((date) => date > TODAY)).toBe(true);
  });

  it("repeats the same working week, so every week has the same number of shifts", () => {
    const perWeek = new Map<string, number>();
    for (const shift of shifts) {
      const week = weekBounds(shift.date).from;
      perWeek.set(week, (perWeek.get(week) ?? 0) + 1);
    }

    expect(perWeek.size).toBe(5);
    expect(new Set(perWeek.values()).size).toBe(1);
  });

  it("follows the date it is given", () => {
    const other = buildDemoData("2027-02-01").shifts.map((s) => s.date);

    expect(other.some((date) => date.startsWith("2027-02"))).toBe(true);
    expect(other).not.toContain(TODAY);
  });

  it("never has two shifts overlapping, even across midnight", () => {
    const spans = shifts
      .map((shift) => span(shift, "2026-01-01"))
      .sort((a, b) => (a[0] as number) - (b[0] as number));

    for (let index = 1; index < spans.length; index += 1) {
      const [, previousEnd] = spans[index - 1] as number[];
      const [start] = spans[index] as number[];
      expect(start as number).toBeGreaterThanOrEqual(previousEnd as number);
    }
  });

  it("leaves a night's rest before any morning shift", () => {
    const spans = shifts
      .map((shift) => span(shift, "2026-01-01"))
      .sort((a, b) => (a[0] as number) - (b[0] as number));

    for (let index = 1; index < spans.length; index += 1) {
      const start = spans[index]?.[0] as number;
      const gap = start - (spans[index - 1]?.[1] as number);
      const isMorning = start % 1440 < 12 * 60;
      if (isMorning) {
        expect(gap).toBeGreaterThanOrEqual(8 * 60);
      }
    }
  });

  it("has a shift that runs past midnight", () => {
    const overnight = shifts.filter(
      (shift) =>
        shiftEndDate(shift.date, shift.startTime, shift.endTime) !== shift.date,
    );

    expect(overnight.length).toBeGreaterThan(0);
  });

  it("only has shifts a real user could have saved", () => {
    for (const shift of shifts) {
      const length = shiftLengthMinutes(shift.startTime, shift.endTime);
      expect(length).toBeGreaterThan(0);
      expect(shift.breakMinutes).toBeLessThanOrEqual(length);
      expect(jobs.map((job) => job.id)).toContain(shift.jobId);
    }
  });

  it("works a realistic week: about 20 to 40 hours in all, a mini-job of about 8 to 9", () => {
    const week = shifts.filter(
      (shift) => weekBounds(shift.date).from === weekBounds(TODAY).from,
    );
    const hours = (jobId?: string) =>
      week
        .filter((shift) => !jobId || shift.jobId === jobId)
        .reduce(
          (total, shift) =>
            total +
            workedMinutes(shift.startTime, shift.endTime, shift.breakMinutes),
          0,
        ) / 60;
    const mini = jobs.find((job) => job.type === "mini_job");

    expect(hours()).toBeGreaterThanOrEqual(20);
    expect(hours()).toBeLessThanOrEqual(40);
    expect(hours(mini?.id)).toBeGreaterThanOrEqual(8);
    expect(hours(mini?.id)).toBeLessThanOrEqual(9);
  });

  it("keeps a full month of the mini-job under the €540 limit", () => {
    const mini = jobs.find((job) => job.type === "mini_job");
    const rate = Number(mini?.hourlyRate);
    const weekly =
      (shifts
        .filter(
          (shift) =>
            shift.jobId === mini?.id &&
            weekBounds(shift.date).from === weekBounds(TODAY).from,
        )
        .reduce(
          (total, shift) =>
            total +
            workedMinutes(shift.startTime, shift.endTime, shift.breakMinutes),
          0,
        ) /
        60) *
      rate;

    expect(weekly * 4).toBeLessThan(540);
    expect(weekly * 4).toBeGreaterThan(540 * 0.8);
  });

  it("gives every shift and job its own id, and every job shifts", () => {
    const ids = [...jobs, ...shifts].map((item) => item.id);

    expect(new Set(ids).size).toBe(ids.length);
    for (const job of jobs) {
      expect(shifts.some((shift) => shift.jobId === job.id)).toBe(true);
    }
  });
});

// The demo's leave as the API hands it out, with its job, for vacationBalance.
function withJob(leave: DemoLeave[], jobs: DemoJob[]) {
  return leave.map((entry) => {
    const job = jobs.find((candidate) => candidate.id === entry.jobId);
    if (!job) {
      throw new Error(`No job ${entry.jobId}`);
    }
    const { id, name, hourlyRate, type } = job;
    return { ...entry, job: { id, name, hourlyRate, type } };
  });
}

function balanceOn(today: string) {
  const { jobs, leave } = buildDemoData(today);
  const cafe = jobs.find((job) => job.name === "Cafe") as DemoJob;
  return vacationBalance({
    setting: vacationSettingOf(cafe),
    year: Number(today.slice(0, 4)),
    leave: withJob(leave, jobs),
    today,
  });
}

describe("buildDemoData, paid vacation", () => {
  it("has the Cafe track 80 hours a year with no carry-over, and the Restaurant not at all", () => {
    const { jobs } = buildDemoData(TODAY);
    const byName = (name: string) => jobs.find((job) => job.name === name);

    expect(byName("Cafe")).toMatchObject({
      vacationHoursPerYear: "80.00",
      vacationCarryOverHours: "0.00",
      vacationCarryOverYear: null,
    });
    expect(byName("Restaurant")).toMatchObject({
      vacationHoursPerYear: null,
      vacationCarryOverHours: "0.00",
      vacationCarryOverYear: null,
    });
  });

  it("books a week and two weeks before this week and two days after it, Monday to Friday, 4h a day", () => {
    const { leave } = buildDemoData(TODAY);

    expect(leave.map(({ startDate, endDate }) => [startDate, endDate])).toEqual(
      [
        ["2026-08-03", "2026-08-14"],
        ["2026-09-14", "2026-09-18"],
        ["2026-12-07", "2026-12-08"],
      ],
    );
    for (const entry of leave) {
      expect(entry).toMatchObject({
        jobId: "demo-job-cafe",
        type: "paid_vacation",
        weekdays: [1, 2, 3, 4, 5],
        minutesPerDay: 240,
      });
    }
  });

  it("takes 60h and plans 8h of the 80h, leaving 12h", () => {
    expect(balanceOn(TODAY)).toEqual({
      entitlementMinutes: 80 * 60,
      carriedOverMinutes: 0,
      takenMinutes: 60 * 60,
      plannedMinutes: 8 * 60,
      leftMinutes: 12 * 60,
    });
  });

  it.each([
    ["March", "2026-03-11", 2],
    // The week six weeks back runs from 29 December to 2 January.
    ["February", "2026-02-10", 1],
    ["October", TODAY, 3],
    ["January", "2027-01-15", 1],
    ["late December", "2026-12-30", 2],
  ])(
    "keeps every booking inside the current year in %s (%s), leaving out what does not fit",
    (_month, today, count) => {
      const { leave } = buildDemoData(today);
      const year = today.slice(0, 4);

      expect(leave).toHaveLength(count);
      for (const entry of leave) {
        expect(entry.startDate.slice(0, 4)).toBe(year);
        expect(entry.endDate.slice(0, 4)).toBe(year);
      }
    },
  );

  it("starts January with a full balance and only the planned days", () => {
    const balance = balanceOn("2027-01-15");

    expect(balance.takenMinutes).toBe(0);
    expect(balance.plannedMinutes).toBe(8 * 60);
  });

  it.each(["2026-03-11", TODAY, "2027-01-15", "2026-12-30"])(
    "never puts paid leave on a day with a shift of the same job (%s)",
    (today) => {
      const { shifts, leave } = buildDemoData(today);

      for (const entry of leave) {
        const days = new Set(
          countedDays(entry.startDate, entry.endDate, entry.weekdays),
        );
        expect(
          shifts.filter(
            (shift) => shift.jobId === entry.jobId && days.has(shift.date),
          ),
        ).toEqual([]);
      }
    },
  );

  it("gives every leave entry its own id", () => {
    const { jobs, shifts, leave } = buildDemoData(TODAY);
    const ids = [...jobs, ...shifts, ...leave].map((item) => item.id);

    expect(new Set(ids).size).toBe(ids.length);
  });
});
