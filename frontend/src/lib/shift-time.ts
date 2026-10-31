import { addDays } from "./dates";

const MINUTES_PER_DAY = 24 * 60;

export function timeToMinutes(time: string): number {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// A shift that ends at an earlier clock time than it starts runs past midnight.
export function shiftLengthMinutes(startTime: string, endTime: string): number {
  const length = timeToMinutes(endTime) - timeToMinutes(startTime);
  return length < 0 ? length + MINUTES_PER_DAY : length;
}

export function workedMinutes(
  startTime: string,
  endTime: string,
  breakMinutes: number,
): number {
  return shiftLengthMinutes(startTime, endTime) - breakMinutes;
}

export function shiftEndDate(
  date: string,
  startTime: string,
  endTime: string,
): string {
  const overnight = timeToMinutes(endTime) < timeToMinutes(startTime);
  return overnight ? addDays(date, 1) : date;
}
