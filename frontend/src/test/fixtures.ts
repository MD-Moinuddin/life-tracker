import type { Job } from "../lib/jobs-api";
import type { Leave } from "../lib/leave-api";
import type { Shift } from "../lib/shifts-api";
import type { SummaryLeave } from "../lib/summary-api";
import { NO_SUMMARY_LEAVE } from "../lib/summary-totals";

export function makeShift(overrides: Partial<Shift> = {}): Shift {
  const date = overrides.date ?? "2026-10-03";
  return {
    id: "shift-1",
    jobId: "job-1",
    job: {
      id: "job-1",
      name: "Warehouse",
      hourlyRate: "12.00",
      type: "part_time",
    },
    date,
    startTime: "09:00",
    endTime: "17:00",
    endDate: date,
    breakMinutes: 0,
    workedMinutes: 480,
    notes: null,
    createdAt: "2026-10-01T09:00:00.000Z",
    updatedAt: "2026-10-01T09:00:00.000Z",
    ...overrides,
  };
}

// A Summary row's or total's leave figures when no paid leave was taken.
export const noLeave: SummaryLeave = { ...NO_SUMMARY_LEAVE };

// A Summary row's or total's leave figures for 40 paid leave hours at 14.00.
export const leave40h: SummaryLeave = {
  earnedMinutes: 2400,
  plannedMinutes: 2400,
  earnedAmount: "560.00",
  plannedAmount: "560.00",
};

// The vacation fields of a job that does not track paid vacation.
export const noVacation: Pick<
  Job,
  "vacationHoursPerYear" | "vacationCarryOverHours" | "vacationCarryOverYear"
> = {
  vacationHoursPerYear: null,
  vacationCarryOverHours: "0.00",
  vacationCarryOverYear: null,
};

// A booked paid-leave entry: Monday to Friday 9 to 13 March 2026, 4h a day, at
// the Cafe (14.00 an hour). Override what a test needs.
export function makeLeave(overrides: Partial<Leave> = {}): Leave {
  return {
    id: "leave-1",
    jobId: "job-1",
    job: { id: "job-1", name: "Cafe", hourlyRate: "14.00", type: "part_time" },
    type: "paid_vacation",
    startDate: "2026-03-09",
    endDate: "2026-03-13",
    weekdays: [1, 2, 3, 4, 5],
    minutesPerDay: 240,
    notes: null,
    createdAt: "2026-02-01T09:00:00.000Z",
    updatedAt: "2026-02-01T09:00:00.000Z",
    ...overrides,
  };
}
