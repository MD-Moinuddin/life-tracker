import { addDays, weekBounds } from "./dates";
import type { Leave } from "./leave-api";
import { isLeaveDayTaken, leaveDaysIn, leaveTotals } from "./leave-days";
import type { Shift } from "./shifts-api";
import { formatCents, shiftEarningsCents } from "./shift-earnings";
import { formatDuration } from "./shift-format";
import { pluralize } from "./plural";

export interface ShiftTotals {
  count: number;
  minutes: number;
  cents: number;
}

export interface ShiftWeek extends ShiftTotals {
  weekStart: string;
  shifts: Shift[];
}

export function totalsOf(shifts: Shift[]): ShiftTotals {
  return {
    count: shifts.length,
    minutes: shifts.reduce((sum, shift) => sum + shift.workedMinutes, 0),
    cents: shifts.reduce((sum, shift) => sum + shiftEarningsCents(shift), 0),
  };
}

// "2 shifts · 12h · €144.00", then "· 3 days paid leave" when there is leave
// (its hours and pay are not in the shift totals). With `hideNoShifts`, a
// span with leave but no shifts says only its days of paid leave.
export function totalsLine(
  totals: ShiftTotals,
  leaveDays = 0,
  { hideNoShifts = false }: { hideNoShifts?: boolean } = {},
): string {
  const parts =
    hideNoShifts && totals.count === 0 && leaveDays > 0
      ? []
      : [
          pluralize(totals.count, "shift"),
          formatDuration(totals.minutes),
          formatCents(totals.cents),
        ];
  if (leaveDays > 0) {
    parts.push(`${pluralize(leaveDays, "day")} paid leave`);
  }
  return parts.join(" · ");
}

// One group per Monday to Sunday week, in the order the weeks first appear,
// so a list sorted either way stays sorted.
export function groupByWeek(shifts: Shift[]): ShiftWeek[] {
  const weeks = new Map<string, Shift[]>();
  for (const shift of shifts) {
    const weekStart = weekBounds(shift.date).from;
    weeks.set(weekStart, [...(weeks.get(weekStart) ?? []), shift]);
  }
  return [...weeks].map(([weekStart, weekShifts]) => ({
    weekStart,
    shifts: weekShifts,
    ...totalsOf(weekShifts),
  }));
}

export interface ShiftWeekWithLeave extends ShiftWeek {
  // The leave periods of this group, by start date.
  leave: Leave[];
  // Their counted days, for the heading (see groupWithLeave).
  leaveDays: number;
}

// History shows one week: all its leave goes under that week, counting only
// the days in it before `before` (today).
export interface LeaveClamp {
  weekStart: string;
  before: string;
}

const NO_TOTALS: ShiftTotals = { count: 0, minutes: 0, cents: 0 };

// The shift weeks with the leave added to the week of each period's start
// date (or, with `clamp`, to the clamped week); a week with only leave gets a
// group of its own. The totals stay those of the shifts. `order` is the order
// of the weeks.
export function groupWithLeave(
  shifts: Shift[],
  leave: Leave[],
  order: "oldest-first" | "newest-first",
  clamp?: LeaveClamp,
): ShiftWeekWithLeave[] {
  const weeks = new Map<string, ShiftWeekWithLeave>(
    groupByWeek(shifts).map((week) => [
      week.weekStart,
      { ...week, leave: [], leaveDays: 0 },
    ]),
  );
  const byStart = [...leave].sort((a, b) =>
    a.startDate.localeCompare(b.startDate),
  );
  for (const entry of byStart) {
    const weekStart = clamp?.weekStart ?? weekBounds(entry.startDate).from;
    const week = weeks.get(weekStart) ?? {
      weekStart,
      shifts: [],
      ...NO_TOTALS,
      leave: [],
      leaveDays: 0,
    };
    week.leave.push(entry);
    week.leaveDays += clamp
      ? leaveDaysIn(entry, clamp.weekStart, addDays(clamp.weekStart, 6)).filter(
          (day) => isLeaveDayTaken(day, clamp.before),
        ).length
      : leaveTotals(entry).days;
    weeks.set(weekStart, week);
  }
  const sign = order === "oldest-first" ? 1 : -1;
  return [...weeks.values()].sort(
    (a, b) => sign * a.weekStart.localeCompare(b.weekStart),
  );
}

// "This week" and its neighbours by name, any other week by its dates.
export function weekTitle(
  weekStart: string,
  today: string,
  formatRange: (from: string, to: string) => string,
): string {
  const current = weekBounds(today).from;
  if (weekStart === current) return "This week";
  if (weekStart === addDays(current, 7)) return "Next week";
  if (weekStart === addDays(current, -7)) return "Last week";
  return formatRange(weekStart, addDays(weekStart, 6));
}
