import { addDays, weekBounds } from "./dates";
import type { Shift } from "./shifts-api";
import { shiftEarningsCents } from "./shift-earnings";

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
