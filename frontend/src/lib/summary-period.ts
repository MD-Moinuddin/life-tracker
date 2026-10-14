import { addDays, weekBounds } from "./dates";
import { formatDateRange, formatMonth } from "./shift-format";

export const SUMMARY_RANGES = ["week", "month"] as const;
export type SummaryRange = (typeof SUMMARY_RANGES)[number];

type Direction = 1 | -1;

interface RangeDefinition {
  label: string;
  step: (date: string, direction: Direction) => string;
  format: (date: string) => string;
}

// Everything that differs between the ranges lives here. Adding a range means
// adding it to SUMMARY_RANGES and giving it a definition.
const RANGE_DEFINITIONS: Record<SummaryRange, RangeDefinition> = {
  week: {
    label: "Week",
    step: (date, direction) => addDays(date, 7 * direction),
    format: (date) => {
      const { from, to } = weekBounds(date);
      return formatDateRange(from, to);
    },
  },
  month: {
    label: "Month",
    step: (date, direction) => {
      const [year = 0, month = 1] = date.split("-").map(Number);
      return new Date(Date.UTC(year, month - 1 + direction, 1))
        .toISOString()
        .slice(0, 10);
    },
    format: formatMonth,
  },
};

export function rangeLabel(range: SummaryRange): string {
  return RANGE_DEFINITIONS[range].label;
}

// Moves a period one step: a week back or forward, or to the first day of the
// previous or next month.
export function stepPeriod(
  range: SummaryRange,
  date: string,
  direction: Direction,
): string {
  return RANGE_DEFINITIONS[range].step(date, direction);
}

export function formatPeriod(range: SummaryRange, date: string): string {
  return RANGE_DEFINITIONS[range].format(date);
}
