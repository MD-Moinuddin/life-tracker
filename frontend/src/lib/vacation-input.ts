// What a visitor may type for vacation hours: at most 1000, at most 2
// decimals, comma or dot. Returns the dot-decimal string, or null when the
// input is not acceptable. The backend enforces the same limits.
const MAX_HOURS = 1000;

export function parseHoursInput(
  input: string,
  { allowZero = false }: { allowZero?: boolean } = {},
): string | null {
  const trimmed = input.trim();
  if (!/^\d{1,4}([.,]\d{1,2})?$/.test(trimmed)) {
    return null;
  }
  const normalised = trimmed.replace(",", ".").replace(/^0+(?=\d)/, "");
  const hours = Number(normalised);
  if (hours > MAX_HOURS || (!allowZero && hours === 0)) {
    return null;
  }
  return normalised;
}

export const CALCULATOR_WEEKS = 4;

// The calculator: weekly hours times four weeks, as a plain number string.
export function calculatorHours(weeklyHours: string): string {
  const weekly = parseHoursInput(weeklyHours, { allowZero: true });
  return weekly === null
    ? "0"
    : String(Number((Number(weekly) * CALCULATOR_WEEKS).toFixed(2)));
}
