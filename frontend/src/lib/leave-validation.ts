import { countedDays } from "./leave-days";

// The rules for a leave entry, in the backend's words (leave.schema.ts and
// date-schemas.ts), so the form says what the API would say before it is asked.

export interface LeaveDraft {
  jobId: string;
  startDate: string;
  endDate: string;
  weekdays: readonly number[];
}

export type LeaveDraftField = "jobId" | "startDate" | "endDate" | "weekdays";

const MIN_DATE = "1900-01-01";
const MAX_DATE = "2100-12-31";
const DATE_RANGE_MESSAGE = "Date must be between 1900 and 2100";

function isSupportedDate(date: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(date) && date >= MIN_DATE && date <= MAX_DATE
  );
}

function dateErrors(date: string, missing: string): string[] {
  if (date === "") {
    return [missing];
  }
  return isSupportedDate(date) ? [] : [DATE_RANGE_MESSAGE];
}

// Two dates the API accepts as one entry: real, in order, in one calendar year.
// Only such a range is worth asking the API about (its shifts, say).
export function isBookableRange(range: {
  startDate: string;
  endDate: string;
}): boolean {
  return (
    isSupportedDate(range.startDate) &&
    isSupportedDate(range.endDate) &&
    range.endDate >= range.startDate &&
    range.startDate.slice(0, 4) === range.endDate.slice(0, 4)
  );
}

export function leaveDraftErrors(
  draft: LeaveDraft,
): Record<LeaveDraftField, string[]> {
  const errors: Record<LeaveDraftField, string[]> = {
    jobId: draft.jobId === "" ? ["Choose a job"] : [],
    startDate: dateErrors(draft.startDate, "Choose a start date"),
    endDate: dateErrors(draft.endDate, "Choose an end date"),
    weekdays:
      draft.weekdays.length === 0 ? ["Pick at least one day of the week"] : [],
  };
  if (errors.startDate.length > 0 || errors.endDate.length > 0) {
    return errors;
  }
  if (draft.endDate < draft.startDate) {
    errors.endDate = ["End date must not be before the start date"];
  } else if (draft.startDate.slice(0, 4) !== draft.endDate.slice(0, 4)) {
    errors.endDate = [
      "Paid leave cannot span two calendar years. Add one entry for each year.",
    ];
  } else if (
    errors.weekdays.length === 0 &&
    countedDays(draft.startDate, draft.endDate, draft.weekdays).length === 0
  ) {
    errors.weekdays = ["None of the selected days fall between these dates"];
  }
  return errors;
}
