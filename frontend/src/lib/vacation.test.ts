import { describe, expect, it } from "vitest";
import type { Leave } from "./leave-api";
import {
  leaveOfTrackedJobs,
  tracksVacation,
  vacationBalance,
  vacationSettingOf,
} from "./vacation";

const setting = {
  hoursPerYear: "80",
  carriedOverHours: "0",
  carryOverYear: null,
};

function week(
  start: string,
  end: string,
  minutesPerDay = 240,
  jobId = "job-1",
): Leave {
  return {
    id: `${jobId}-${start}`,
    jobId,
    job: { id: jobId, name: "Cafe", hourlyRate: "14.00", type: "part_time" },
    type: "paid_vacation",
    startDate: start,
    endDate: end,
    weekdays: [1, 2, 3, 4, 5],
    minutesPerDay,
    notes: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("vacationBalance", () => {
  it("splits a year into taken, planned and left around today", () => {
    const leave = [
      week("2026-03-09", "2026-03-13"),
      week("2026-08-03", "2026-08-14"),
      week("2026-12-28", "2026-12-29"),
    ];

    expect(
      vacationBalance({ setting, year: 2026, leave, today: "2026-10-31" }),
    ).toEqual({
      entitlementMinutes: 4800,
      carriedOverMinutes: 0,
      takenMinutes: 3600,
      plannedMinutes: 480,
      leftMinutes: 720,
    });
  });

  it("counts a past day as taken and today as planned", () => {
    const leave = [
      week("2026-10-30", "2026-10-30"),
      week("2026-11-02", "2026-11-02"),
    ];

    const balance = vacationBalance({
      setting,
      year: 2026,
      leave,
      today: "2026-11-02",
    });

    expect(balance.takenMinutes).toBe(240);
    expect(balance.plannedMinutes).toBe(240);
  });

  it("counts only the days inside the year", () => {
    const leave = [week("2026-12-28", "2026-12-31")];

    const balance = vacationBalance({
      setting,
      year: 2027,
      leave,
      today: "2027-01-01",
    });

    expect(balance.takenMinutes).toBe(0);
    expect(balance.plannedMinutes).toBe(0);
    expect(balance.leftMinutes).toBe(4800);
  });

  it("adds carried-over hours only for their own year", () => {
    const carried = {
      hoursPerYear: "80",
      carriedOverHours: "10",
      carryOverYear: 2026,
    };
    const base = { leave: [], today: "2026-01-01" };

    expect(
      vacationBalance({ setting: carried, year: 2026, ...base }),
    ).toMatchObject({
      carriedOverMinutes: 600,
      leftMinutes: 5400,
    });
    expect(
      vacationBalance({ setting: carried, year: 2027, ...base }),
    ).toMatchObject({
      carriedOverMinutes: 0,
      leftMinutes: 4800,
    });
  });

  it("goes negative when more is booked than the allowance", () => {
    const leave = [week("2026-11-02", "2026-11-27", 480)];

    const balance = vacationBalance({
      setting,
      year: 2026,
      leave,
      today: "2026-10-31",
    });

    expect(balance.leftMinutes).toBeLessThan(0);
  });

  it("clips a leave that crosses the year end to the year asked for", () => {
    // The backend refuses such a leave; the balance still must not count the
    // days of the other year.
    const crossing = week("2026-12-28", "2027-01-04");

    const in2026 = vacationBalance({
      setting,
      year: 2026,
      leave: [crossing],
      today: "2026-10-31",
    });
    const in2027 = vacationBalance({
      setting,
      year: 2027,
      leave: [crossing],
      today: "2026-10-31",
    });

    // Mon 28 to Fri 1 Jan is Mon-Fri only: 28, 29, 30, 31 in 2026; 1 and 4 Jan in 2027.
    expect(in2026.plannedMinutes).toBe(4 * 240);
    expect(in2027.plannedMinutes).toBe(2 * 240);
  });

  it("is all zeros when vacation is not tracked", () => {
    expect(
      vacationBalance({
        setting: {
          hoursPerYear: null,
          carriedOverHours: "0",
          carryOverYear: null,
        },
        year: 2026,
        leave: [],
        today: "2026-10-31",
      }),
    ).toEqual({
      entitlementMinutes: 0,
      carriedOverMinutes: 0,
      takenMinutes: 0,
      plannedMinutes: 0,
      leftMinutes: 0,
    });
  });
});

describe("tracksVacation", () => {
  it("is false for null and for an absent field", () => {
    expect(tracksVacation({ vacationHoursPerYear: null })).toBe(false);
    expect(tracksVacation({})).toBe(false);
    expect(tracksVacation({ vacationHoursPerYear: undefined })).toBe(false);
  });

  it("is true for any amount, even 0.00", () => {
    expect(tracksVacation({ vacationHoursPerYear: "80.00" })).toBe(true);
    expect(tracksVacation({ vacationHoursPerYear: "0.00" })).toBe(true);
  });
});

describe("leaveOfTrackedJobs", () => {
  const leave = [
    week("2026-03-09", "2026-03-13", 240, "job-1"),
    week("2026-03-09", "2026-03-13", 240, "job-2"),
    week("2026-03-09", "2026-03-13", 240, "job-3"),
    week("2026-03-09", "2026-03-13", 240, "job-4"),
  ];
  const jobs = [
    { id: "job-1", vacationHoursPerYear: "80.00" },
    { id: "job-2", vacationHoursPerYear: null },
    { id: "job-3" },
  ];

  it("keeps only the leave of jobs that are listed and track vacation", () => {
    expect(leaveOfTrackedJobs(leave, jobs).map((entry) => entry.jobId)).toEqual(
      ["job-1"],
    );
  });

  it("keeps nothing when no job is given", () => {
    expect(leaveOfTrackedJobs(leave, [])).toEqual([]);
  });
});

describe("vacationSettingOf", () => {
  it("reads a job's vacation fields as the setting the balance needs", () => {
    expect(
      vacationSettingOf({
        vacationHoursPerYear: "80.00",
        vacationCarryOverHours: "8.00",
        vacationCarryOverYear: 2026,
      }),
    ).toEqual({
      hoursPerYear: "80.00",
      carriedOverHours: "8.00",
      carryOverYear: 2026,
    });
  });

  it("treats missing fields of older responses as no vacation and no carry-over", () => {
    expect(vacationSettingOf({})).toEqual({
      hoursPerYear: null,
      carriedOverHours: "0",
      carryOverYear: null,
    });
  });
});
