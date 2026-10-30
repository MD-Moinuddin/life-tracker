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

// The two parts a date tile shows: "Sat" over "3".
export function formatTileDate(date: string): { weekday: string; day: number } {
  const { weekday, day } = parts(date);
  return { weekday: weekday ?? "", day };
}

export function formatDateRange(from: string, to: string): string {
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

// The same times in the least room: "09:00–17:00". A shift that ends the next
// day is marked "+1". Screen readers get formatTimeRange instead.
export function formatTimeSpan(
  shift: Pick<Shift, "date" | "startTime" | "endTime" | "endDate">,
): string {
  const nextDay = shift.endDate === shift.date ? "" : " +1";
  return `${shift.startTime}–${shift.endTime}${nextDay}`;
}

const longDate = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

// "Friday 30 October".
export function formatLongDate(date: string): string {
  return longDate.format(new Date(`${date}T00:00:00Z`)).replace(",", "");
}
