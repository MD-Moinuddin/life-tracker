const MINUTES_PER_DAY = 24 * 60;

export function timeToMinutes(time: string): number {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

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

export function addDays(date: string, days: number): string {
  // UTC avoids daylight-saving changes moving the calendar day.
  const result = new Date(`${date}T00:00:00Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

export function shiftEndDate(
  date: string,
  startTime: string,
  endTime: string,
): string {
  const overnight = timeToMinutes(endTime) < timeToMinutes(startTime);
  return overnight ? addDays(date, 1) : date;
}

export function shiftEndsAt(
  date: string,
  startTime: string,
  endTime: string,
): string {
  return `${shiftEndDate(date, startTime, endTime)}T${endTime}`;
}
