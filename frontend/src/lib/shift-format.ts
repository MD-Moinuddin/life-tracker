import type { Shift } from "./shifts-api";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function parts(date: string) {
  const parsed = new Date(`${date}T00:00:00Z`);
  return {
    weekday: WEEKDAYS[parsed.getUTCDay()],
    day: parsed.getUTCDate(),
    month: MONTHS[parsed.getUTCMonth()],
    year: parsed.getUTCFullYear(),
  };
}

export function formatDay(date: string): string {
  const { weekday, day, month } = parts(date);
  return `${weekday} ${day} ${month}`;
}

export function formatWeekRange(from: string, to: string): string {
  const start = parts(from);
  const end = parts(to);
  const startYear = start.year === end.year ? "" : ` ${start.year}`;
  return `${start.day} ${start.month}${startYear} to ${end.day} ${end.month} ${end.year}`;
}

export function formatMonth(date: string): string {
  const { month, year } = parts(date);
  return `${month} ${year}`;
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) {
    return `${rest}m`;
  }
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

export function formatTimeRange(
  shift: Pick<Shift, "date" | "startTime" | "endTime" | "endDate">,
): string {
  const nextDay = shift.endDate === shift.date ? "" : " (next day)";
  return `${shift.startTime} to ${shift.endTime}${nextDay}`;
}
