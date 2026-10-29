import { addDays } from "./dates";

const MAX_DAYS_AHEAD = 7;

// A friendly label for a day that is close, so the eye finds what is next.
// Anything further away, or in the past, has none.
export function relativeDayLabel(date: string, today: string): string | null {
  if (date === today) return "Today";
  if (date === addDays(today, 1)) return "Tomorrow";
  for (let days = 2; days <= MAX_DAYS_AHEAD; days += 1) {
    if (date === addDays(today, days)) return `In ${days} days`;
  }
  return null;
}
