import { countedDays, daysInRange, isLeaveDayTaken } from "./leave-days";
import type { Leave } from "./leave-api";

export interface VacationSetting {
  hoursPerYear: string | null;
  carriedOverHours: string;
  carryOverYear: number | null;
}

export interface VacationBalance {
  entitlementMinutes: number;
  carriedOverMinutes: number;
  takenMinutes: number;
  plannedMinutes: number;
  leftMinutes: number;
}

// `!= null`, not `!== null`: older and demo responses may leave the field out,
// and that means the job does not track vacation. Always use this instead of
// comparing the field yourself.
export function tracksVacation(job: {
  vacationHoursPerYear?: string | null;
}): boolean {
  return job.vacationHoursPerYear != null;
}

// A job's vacation fields as the setting `vacationBalance` reads. Older and
// demo responses may leave the fields out: no allowance, no carry-over.
export function vacationSettingOf(job: {
  vacationHoursPerYear?: string | null;
  vacationCarryOverHours?: string;
  vacationCarryOverYear?: number | null;
}): VacationSetting {
  return {
    hoursPerYear: job.vacationHoursPerYear ?? null,
    carriedOverHours: job.vacationCarryOverHours ?? "0",
    carryOverYear: job.vacationCarryOverYear ?? null,
  };
}

// GET /api/leave also returns the leave of jobs that stopped tracking vacation;
// the UI ignores it until tracking is turned on again.
export function leaveOfTrackedJobs(
  leave: Leave[],
  jobs: readonly { id: string; vacationHoursPerYear?: string | null }[],
): Leave[] {
  const tracked = new Set(
    jobs.filter((job) => tracksVacation(job)).map((job) => job.id),
  );
  return leave.filter((entry) => tracked.has(entry.jobId));
}

// A job's allowance for a year against its leave. Days before `today` are
// taken, today and later are planned; only days inside the year count.
export function vacationBalance({
  setting,
  year,
  leave,
  today,
}: {
  setting: VacationSetting;
  year: number;
  leave: Leave[];
  today: string;
}): VacationBalance {
  const entitlementMinutes = Math.round(Number(setting.hoursPerYear ?? 0) * 60);
  const carriedOverMinutes =
    setting.carryOverYear === year
      ? Math.round(Number(setting.carriedOverHours) * 60)
      : 0;
  let takenMinutes = 0;
  let plannedMinutes = 0;
  for (const entry of leave) {
    const days = daysInRange(
      countedDays(entry.startDate, entry.endDate, entry.weekdays),
      `${year}-01-01`,
      `${year}-12-31`,
    );
    const taken = days.filter((day) => isLeaveDayTaken(day, today)).length;
    takenMinutes += taken * entry.minutesPerDay;
    plannedMinutes += (days.length - taken) * entry.minutesPerDay;
  }
  return {
    entitlementMinutes,
    carriedOverMinutes,
    takenMinutes,
    plannedMinutes,
    leftMinutes:
      entitlementMinutes + carriedOverMinutes - takenMinutes - plannedMinutes,
  };
}
