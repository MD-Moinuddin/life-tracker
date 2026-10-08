import type { Shift } from "./shifts-api";
import type { SummaryRange } from "./summary-api";

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function localNow(now = new Date()): string {
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return `${date}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export function addDays(date: string, days: number): string {
  const result = new Date(`${date}T00:00:00Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

export function weekBounds(date: string) {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  const from = addDays(date, -((weekday + 6) % 7));
  return { from, to: addDays(from, 6) };
}

export function hasEnded(
  shift: Pick<Shift, "endDate" | "endTime">,
  now: string,
): boolean {
  return `${shift.endDate}T${shift.endTime}` <= now;
}

// Moves a summary period one step: a week back or forward, or to the first day
// of the previous or next month.
export function stepPeriod(
  range: SummaryRange,
  date: string,
  direction: 1 | -1,
): string {
  if (range === "week") {
    return addDays(date, 7 * direction);
  }
  const [year = 0, month = 1] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1 + direction, 1))
    .toISOString()
    .slice(0, 10);
}
