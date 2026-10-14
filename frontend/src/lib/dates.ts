import type { Shift } from "./shifts-api";

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
