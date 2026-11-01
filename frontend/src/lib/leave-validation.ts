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

// The calendar dates the API accepts (the backend's date-schemas.ts).
export const MIN_CALENDAR_DATE = "1900-01-01";
export const MAX_CALENDAR_DATE = "2100-12-31";
export const DATE_RANGE_MESSAGE = "Date must be between 1900 and 2100";
export const WEEKDAYS_MESSAGE = "Pick at least one day of the week";

function isSupportedDate(date: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    date >= MIN_CALENDAR_DATE &&
    date <= MAX_CALENDAR_DATE
  );
}

export interface LeaveDatesIssue {
  field: "endDate" | "weekdays";
  message: string;
}

// The rules across a leave entry's fields, in the backend's order and words
// (validateLeaveDates in leave.schema.ts). For real dates and valid weekdays.
export function validateLeaveDates(leave: {
  startDate: string;
  endDate: string;
  weekdays: readonly number[];
}): LeaveDatesIssue | null {
  if (leave.endDate < leave.startDate) {
    return {
      field: "endDate",
      message: "End date must not be before the start date",
    };
  }
  if (leave.startDate.slice(0, 4) !== leave.endDate.slice(0, 4)) {
    return {
      field: "endDate",
      message:
        "Paid leave cannot span two calendar years. Add one entry for each year.",
    };
  }
  if (
    countedDays(leave.startDate, leave.endDate, leave.weekdays).length === 0
  ) {
    return {
      field: "weekdays",
      message: "None of the selected days fall between these dates",
    };
  }
  return null;
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
    weekdays: draft.weekdays.length === 0 ? [WEEKDAYS_MESSAGE] : [],
  };
  if (errors.startDate.length > 0 || errors.endDate.length > 0) {
    return errors;
  }
  const issue = validateLeaveDates(draft);
  // An empty pick already says to pick a day.
  if (issue && !(issue.field === "weekdays" && errors.weekdays.length > 0)) {
    errors[issue.field] = [issue.message];
  }
  return errors;
}
