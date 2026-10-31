import { addDays } from "./dates";
import { shiftEarningsCents } from "./shift-earnings";

// Every date from `start` to `end` (inclusive) whose weekday is in `weekdays`.
// Keep in step with the backend's lib/leave-days.ts.
export function countedDays(
  start: string,
  end: string,
  weekdays: readonly number[],
): string[] {
  const days: string[] = [];
  for (let date = start; date <= end; date = addDays(date, 1)) {
    if (weekdays.includes(new Date(`${date}T00:00:00Z`).getUTCDay())) {
      days.push(date);
    }
  }
  return days;
}

// The days of a list that fall inside [from, to], both ends included.
export function daysInRange(
  days: readonly string[],
  from: string,
  to: string,
): string[] {
  return days.filter((day) => day >= from && day <= to);
}

// The one rule for taken and planned leave: a counted day before today is
// taken, today and later is planned. Keep in step with the backend's summary.
export function isLeaveDayTaken(day: string, today: string): boolean {
  return day < today;
}

// A leave entry is planned (still to come, at least in part) while its last
// day is today or later.
export function isLeavePlanned(
  leave: { endDate: string },
  today: string,
): boolean {
  return leave.endDate >= today;
}

// The counted days of a leave entry that fall inside [from, to].
export function leaveDaysIn(
  leave: { startDate: string; endDate: string; weekdays: readonly number[] },
  from: string,
  to: string,
): string[] {
  return daysInRange(
    countedDays(leave.startDate, leave.endDate, leave.weekdays),
    from,
    to,
  );
}

// How many counted days all of `leave` has in the Monday to Sunday week that
// starts on `weekStart`.
export function leaveDaysInWeek(
  leave: readonly {
    startDate: string;
    endDate: string;
    weekdays: readonly number[];
  }[],
  weekStart: string,
): number {
  const weekEnd = addDays(weekStart, 6);
  return leave.reduce(
    (sum, entry) => sum + leaveDaysIn(entry, weekStart, weekEnd).length,
    0,
  );
}

// What a leave entry counts for: its days, the minutes they add up to and the
// pay (the same half-up rule as a shift's earnings).
export function leaveTotals(leave: {
  startDate: string;
  endDate: string;
  weekdays: readonly number[];
  minutesPerDay: number;
  job: { hourlyRate: string };
}) {
  const days = countedDays(leave.startDate, leave.endDate, leave.weekdays);
  const minutes = days.length * leave.minutesPerDay;
  return {
    days: days.length,
    minutes,
    cents: shiftEarningsCents({ job: leave.job, workedMinutes: minutes }),
  };
}

// The pay of one counted day of a leave entry.
export function leaveDayCents(leave: {
  minutesPerDay: number;
  job: { hourlyRate: string };
}): number {
  return shiftEarningsCents({
    job: leave.job,
    workedMinutes: leave.minutesPerDay,
  });
}
