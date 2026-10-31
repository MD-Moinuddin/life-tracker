import { beforeEach, describe, expect, it, vi } from "vitest";
import { listLeaveInRange } from "../leave/leave.service";
import type { LeaveResponse } from "../leave/leave.service";
import { listShiftsInRange } from "../shifts/shift.service";
import { getSummary } from "./summary.service";

vi.mock("../shifts/shift.service", () => ({
  listShiftsInRange: vi.fn(),
}));

vi.mock("../leave/leave.service", () => ({
  listLeaveInRange: vi.fn(),
}));

type ShiftResponse = Awaited<ReturnType<typeof listShiftsInRange>>[number];
type JobResponse = ShiftResponse["job"];

const warehouse: JobResponse = {
  id: "job-w",
  name: "Warehouse",
  hourlyRate: "12.00",
  type: "part_time",
};
const cafe: JobResponse = {
  id: "job-c",
  name: "Cafe",
  hourlyRate: "10.00",
  type: "mini_job",
};
const bakery: JobResponse = {
  id: "job-b",
  name: "Bakery",
  hourlyRate: "10.00",
  type: "part_time",
};
const tutoring: JobResponse = {
  id: "job-t",
  name: "Tutoring",
  hourlyRate: "7.50",
  type: "part_time",
};

const month = {
  range: "month",
  date: "2026-10-15",
  now: "2026-10-31T23:59",
} as const;

function shiftFor(
  job: JobResponse,
  workedMinutes: number,
  overrides: Partial<ShiftResponse> = {},
): ShiftResponse {
  return {
    id: "shift-1",
    jobId: job.id,
    job,
    date: "2026-10-03",
    startTime: "09:00",
    endTime: "17:00",
    endDate: "2026-10-03",
    breakMinutes: 0,
    workedMinutes,
    notes: null,
    createdAt: new Date("2026-10-01T09:00:00Z"),
    updatedAt: new Date("2026-10-01T09:00:00Z"),
    ...overrides,
  };
}

function mockShifts(shifts: ShiftResponse[]) {
  vi.mocked(listShiftsInRange).mockResolvedValue(shifts);
}

function leaveFor(
  job: JobResponse,
  overrides: Partial<LeaveResponse> = {},
): LeaveResponse {
  return {
    id: "leave-1",
    jobId: job.id,
    job,
    type: "paid_vacation",
    startDate: "2026-10-12",
    endDate: "2026-10-16",
    weekdays: [1, 2, 3, 4, 5],
    minutesPerDay: 240,
    notes: null,
    createdAt: new Date("2026-10-01T09:00:00Z"),
    updatedAt: new Date("2026-10-01T09:00:00Z"),
    ...overrides,
  };
}

function mockLeave(leave: LeaveResponse[]) {
  vi.mocked(listLeaveInRange).mockResolvedValue(leave);
}

const noLeave = {
  earnedMinutes: 0,
  plannedMinutes: 0,
  earnedAmount: "0.00",
  plannedAmount: "0.00",
};

beforeEach(() => {
  vi.clearAllMocks();
  mockLeave([]);
});

describe("period", () => {
  it("asks for the calendar month or the Monday to Sunday week", async () => {
    mockShifts([]);

    const monthResult = await getSummary("user-1", month);
    const weekResult = await getSummary("user-1", {
      range: "week",
      date: "2026-10-07",
      now: month.now,
    });

    expect(listShiftsInRange).toHaveBeenNthCalledWith(1, "user-1", {
      from: "2026-10-01",
      to: "2026-10-31",
    });
    expect(listShiftsInRange).toHaveBeenNthCalledWith(2, "user-1", {
      from: "2026-10-05",
      to: "2026-10-11",
    });
    expect(listLeaveInRange).toHaveBeenNthCalledWith(1, "user-1", {
      from: "2026-10-01",
      to: "2026-10-31",
    });
    expect(listLeaveInRange).toHaveBeenNthCalledWith(2, "user-1", {
      from: "2026-10-05",
      to: "2026-10-11",
    });
    expect(monthResult).toMatchObject({ from: "2026-10-01", to: "2026-10-31" });
    expect(weekResult).toMatchObject({ from: "2026-10-05", to: "2026-10-11" });
  });
});

describe("totals per job", () => {
  it("groups by job in name order and adds up minutes and amounts", async () => {
    mockShifts([
      shiftFor(warehouse, 480),
      shiftFor(cafe, 120),
      shiftFor(warehouse, 240),
    ]);

    const result = await getSummary("user-1", month);

    expect(result.jobs).toEqual([
      {
        jobId: "job-c",
        name: "Cafe",
        type: "mini_job",
        hourlyRate: "10.00",
        earnedMinutes: 120,
        plannedMinutes: 120,
        earnedAmount: "20.00",
        plannedAmount: "20.00",
        leave: noLeave,
      },
      {
        jobId: "job-w",
        name: "Warehouse",
        type: "part_time",
        hourlyRate: "12.00",
        earnedMinutes: 720,
        plannedMinutes: 720,
        earnedAmount: "144.00",
        plannedAmount: "144.00",
        leave: noLeave,
      },
    ]);
    expect(result.totals).toEqual({
      earnedMinutes: 840,
      plannedMinutes: 840,
      earnedAmount: "164.00",
      plannedAmount: "164.00",
      leave: noLeave,
    });
  });

  it("rounds once per job from the total minutes, not once per shift", async () => {
    mockShifts([shiftFor(bakery, 7), shiftFor(bakery, 7)]);

    const result = await getSummary("user-1", month);

    expect(result.jobs[0]?.plannedAmount).toBe("2.33");
  });

  it("makes the total the sum of the rounded job amounts", async () => {
    mockShifts([shiftFor(bakery, 14), shiftFor(cafe, 14)]);

    const result = await getSummary("user-1", month);

    expect(result.jobs.map((job) => job.plannedAmount)).toEqual([
      "2.33",
      "2.33",
    ]);
    expect(result.totals.plannedAmount).toBe("4.66");
  });

  it("rounds halves up", async () => {
    mockShifts([shiftFor(tutoring, 1)]);

    const result = await getSummary("user-1", month);

    expect(result.jobs[0]?.plannedAmount).toBe("0.13");
  });
});

describe("earned and planned", () => {
  it("counts a shift as earned once it has ended, at or before now", async () => {
    mockShifts([
      shiftFor(warehouse, 120, { endTime: "11:00" }),
      shiftFor(warehouse, 120, { endTime: "12:00" }),
      shiftFor(warehouse, 120, { endTime: "13:00" }),
      shiftFor(warehouse, 120, { date: "2026-10-05", endDate: "2026-10-05" }),
    ]);

    const result = await getSummary("user-1", {
      ...month,
      now: "2026-10-03T12:00",
    });

    expect(result.jobs[0]).toMatchObject({
      earnedMinutes: 240,
      plannedMinutes: 480,
      earnedAmount: "48.00",
      plannedAmount: "96.00",
    });
  });

  it.each([
    ["the evening it starts", "2026-10-03T23:00", 0],
    ["just before it ends", "2026-10-04T01:59", 0],
    ["exactly when it ends", "2026-10-04T02:00", 240],
  ])(
    "judges an overnight shift by its end, %s",
    async (_label, now, earned) => {
      mockShifts([
        shiftFor(warehouse, 240, {
          startTime: "22:00",
          endDate: "2026-10-04",
          endTime: "02:00",
        }),
      ]);

      const result = await getSummary("user-1", { ...month, now });

      expect(result.jobs[0]?.earnedMinutes).toBe(earned);
      expect(result.jobs[0]?.plannedMinutes).toBe(240);
    },
  );
});

describe("mini-job warning", () => {
  it("does not warn at exactly 540.00 and warns above it", async () => {
    mockShifts([shiftFor(cafe, 3240)]);
    const atLimit = await getSummary("user-1", month);
    mockShifts([shiftFor(cafe, 3241)]);
    const above = await getSummary("user-1", month);

    expect(atLimit.miniJob).toEqual({
      plannedAmount: "540.00",
      threshold: "540.00",
      warning: false,
    });
    expect(above.miniJob).toEqual({
      plannedAmount: "540.17",
      threshold: "540.00",
      warning: true,
    });
  });

  it("warns on planned earnings, even when nothing is earned yet", async () => {
    mockShifts([shiftFor(cafe, 3241)]);

    const result = await getSummary("user-1", {
      ...month,
      now: "2026-10-01T00:00",
    });

    expect(result.jobs[0]?.earnedAmount).toBe("0.00");
    expect(result.miniJob?.warning).toBe(true);
  });

  it("counts only mini-jobs toward the warning", async () => {
    mockShifts([shiftFor(warehouse, 6000), shiftFor(cafe, 600)]);

    const result = await getSummary("user-1", month);

    expect(result.totals.plannedAmount).toBe("1300.00");
    expect(result.miniJob).toEqual({
      plannedAmount: "100.00",
      threshold: "540.00",
      warning: false,
    });
  });

  it("leaves the mini-job block out of the week summary", async () => {
    mockShifts([shiftFor(cafe, 3241)]);

    const result = await getSummary("user-1", {
      range: "week",
      date: "2026-10-07",
      now: month.now,
    });

    expect(JSON.parse(JSON.stringify(result))).not.toHaveProperty("miniJob");
  });
});

describe("an empty period", () => {
  it("returns zeros and no warning", async () => {
    mockShifts([]);

    const result = await getSummary("user-1", month);

    expect(result.jobs).toEqual([]);
    expect(result.totals).toEqual({
      earnedMinutes: 0,
      plannedMinutes: 0,
      earnedAmount: "0.00",
      plannedAmount: "0.00",
      leave: noLeave,
    });
    expect(result.miniJob).toEqual({
      plannedAmount: "0.00",
      threshold: "540.00",
      warning: false,
    });
  });
});

describe("paid leave", () => {
  // Monday 12 to Friday 16 October 2026, 4 hours a day.
  const midMonth = { ...month, now: "2026-10-14T12:00" };

  it("counts leave days before today as earned, and today on as planned", async () => {
    mockShifts([shiftFor(warehouse, 120)]);
    mockLeave([leaveFor(warehouse)]);

    const result = await getSummary("user-1", midMonth);

    expect(result.jobs[0]).toMatchObject({
      earnedMinutes: 120,
      plannedMinutes: 120,
      earnedAmount: "24.00",
      plannedAmount: "24.00",
      leave: {
        earnedMinutes: 480,
        plannedMinutes: 1200,
        earnedAmount: "96.00",
        plannedAmount: "240.00",
      },
    });
  });

  it.each([
    ["the day before", "2026-10-11T23:59", 0],
    ["the morning of", "2026-10-12T00:00", 0],
    ["the evening of", "2026-10-12T23:59", 0],
    ["the day after", "2026-10-13T00:00", 60],
  ])(
    "judges a single leave day by its date, %s",
    async (_label, now, earned) => {
      mockShifts([]);
      mockLeave([
        leaveFor(cafe, {
          startDate: "2026-10-12",
          endDate: "2026-10-12",
          weekdays: [1],
          minutesPerDay: 60,
        }),
      ]);

      const result = await getSummary("user-1", { ...month, now });

      expect(result.jobs[0]?.leave).toMatchObject({
        earnedMinutes: earned,
        plannedMinutes: 60,
      });
    },
  );

  it("counts only the days inside the period", async () => {
    mockShifts([]);
    mockLeave([
      // Starts before the week of 5 to 11 October.
      leaveFor(warehouse, { startDate: "2026-09-28", endDate: "2026-10-06" }),
      // Ends after it.
      leaveFor(cafe, {
        id: "leave-2",
        startDate: "2026-10-09",
        endDate: "2026-10-20",
      }),
    ]);

    const result = await getSummary("user-1", {
      range: "week",
      date: "2026-10-07",
      now: "2026-10-01T00:00",
    });

    expect(
      result.jobs.map((job) => [job.name, job.leave.plannedMinutes]),
    ).toEqual([
      ["Cafe", 240],
      ["Warehouse", 480],
    ]);
  });

  it("skips leave with no counted day in the period", async () => {
    mockShifts([]);
    // Saturday 10 October only, but the week asked for is 12 to 18 October.
    mockLeave([
      leaveFor(cafe, {
        startDate: "2026-10-05",
        endDate: "2026-10-16",
        weekdays: [6],
      }),
    ]);

    const result = await getSummary("user-1", {
      range: "week",
      date: "2026-10-14",
      now: month.now,
    });

    expect(result.jobs).toEqual([]);
    expect(result.totals.leave).toEqual(noLeave);
  });

  it("adds up several entries of one job before rounding", async () => {
    const rounding: JobResponse = { ...bakery, hourlyRate: "12.34" };
    mockShifts([]);
    mockLeave([
      leaveFor(rounding, {
        startDate: "2026-10-05",
        endDate: "2026-10-05",
        weekdays: [1],
        minutesPerDay: 15,
      }),
      leaveFor(rounding, {
        id: "leave-2",
        startDate: "2026-10-06",
        endDate: "2026-10-06",
        weekdays: [2],
        minutesPerDay: 15,
      }),
    ]);

    const result = await getSummary("user-1", month);

    expect(result.jobs).toHaveLength(1);
    expect(result.jobs[0]?.leave.plannedAmount).toBe("6.17");
  });

  it("makes the leave total the sum of the rounded job amounts", async () => {
    const quarterHour = {
      startDate: "2026-10-05",
      endDate: "2026-10-05",
      weekdays: [1],
      minutesPerDay: 15,
    };
    mockShifts([]);
    mockLeave([
      leaveFor({ ...bakery, hourlyRate: "12.34" }, quarterHour),
      leaveFor(
        { ...cafe, hourlyRate: "12.34" },
        { id: "leave-2", ...quarterHour },
      ),
    ]);

    const result = await getSummary("user-1", month);

    expect(result.jobs.map((job) => job.leave.plannedAmount)).toEqual([
      "3.09",
      "3.09",
    ]);
    expect(result.totals.leave).toEqual({
      earnedMinutes: 30,
      plannedMinutes: 30,
      earnedAmount: "6.18",
      plannedAmount: "6.18",
    });
  });

  it("gives a job with only leave a row with zero worked minutes, in name order", async () => {
    mockShifts([shiftFor(warehouse, 60)]);
    mockLeave([leaveFor(bakery)]);

    const result = await getSummary("user-1", midMonth);

    expect(result.jobs.map((job) => job.name)).toEqual(["Bakery", "Warehouse"]);
    expect(result.jobs[0]).toEqual({
      jobId: "job-b",
      name: "Bakery",
      type: "part_time",
      hourlyRate: "10.00",
      earnedMinutes: 0,
      plannedMinutes: 0,
      earnedAmount: "0.00",
      plannedAmount: "0.00",
      leave: {
        earnedMinutes: 480,
        plannedMinutes: 1200,
        earnedAmount: "80.00",
        plannedAmount: "200.00",
      },
    });
    expect(result.jobs[1]?.leave).toEqual(noLeave);
  });

  it("adds planned mini-job leave to the mini-job limit, not part-time leave", async () => {
    mockShifts([shiftFor(cafe, 3000)]);
    mockLeave([
      leaveFor(warehouse, { minutesPerDay: 720 }),
      leaveFor(cafe, {
        id: "leave-2",
        startDate: "2026-10-19",
        endDate: "2026-10-19",
        weekdays: [1],
        minutesPerDay: 241,
      }),
    ]);

    const result = await getSummary("user-1", month);

    expect(result.miniJob).toEqual({
      plannedAmount: "540.17",
      threshold: "540.00",
      warning: true,
    });
    expect(result.totals.plannedAmount).toBe("500.00");
  });
});
