import { formatEuro } from "./money";
import type { Shift } from "./shifts-api";

// The same rule as the backend summary: rate x minutes / 60, rounded half up to
// the cent. Whole cents avoid adding up floating point euros.
export function shiftEarningsCents(
  shift: Pick<Shift, "job" | "workedMinutes">,
): number {
  const rateCents = Math.round(Number(shift.job.hourlyRate) * 100);
  return Math.round((rateCents * shift.workedMinutes) / 60);
}

export function formatCents(cents: number): string {
  return formatEuro((cents / 100).toFixed(2));
}
