import { addDays } from "./shift-time";

// Every date from `start` to `end` (inclusive) whose weekday is in `weekdays`.
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
