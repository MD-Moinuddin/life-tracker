import { ApiError } from "../api-client";
import type { FieldErrors } from "../api-client";
import type { JobType } from "../jobs-api";
import {
  DATE_RANGE_MESSAGE,
  MAX_CALENDAR_DATE,
  MIN_CALENDAR_DATE,
  validateLeaveDates,
  WEEKDAYS_MESSAGE,
} from "../leave-validation";
import { shiftLengthMinutes } from "../shift-time";
import type { ShiftInput } from "../shifts-api";

// The same rules as the backend's job, shift and leave schemas, so the demo
// refuses what the real app would refuse and the forms show the same
// messages. The messages are copied from backend/src/modules/*/*.schema.ts and
// backend/src/lib/date-schemas.ts; the tests replay the backend's cases.

const JOB_TYPES: readonly JobType[] = ["part_time", "mini_job"];
const RATE = /^\d{1,6}(\.\d{1,2})?$/;
const CLOCK = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const HOURS = /^\d{1,4}(\.\d{1,2})?$/;
const MAX_VACATION_HOURS = 1000;
const DATE_FORMAT_MESSAGE = "Date must be a real date in YYYY-MM-DD format";
const EMPTY_UPDATE_MESSAGE = "Provide at least one field to update";

function fail(fields: FieldErrors): never {
  throw new ApiError(400, "Validation failed", fields);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isRealDate(value: string): boolean {
  const parsed = new Date(`${value}T00:00:00Z`);
  return (
    DATE.test(value) &&
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

// The backend's calendarDate: a real date, between 1900 and 2100.
function calendarDateErrors(value: unknown): string[] {
  if (typeof value !== "string" || !isRealDate(value)) {
    return [DATE_FORMAT_MESSAGE];
  }
  return value < MIN_CALENDAR_DATE || value > MAX_CALENDAR_DATE
    ? [DATE_RANGE_MESSAGE]
    : [];
}

export interface JobFields {
  name: string;
  hourlyRate: string;
  type: JobType;
  vacationHoursPerYear?: string | null;
  vacationCarryOverHours?: string;
  vacationCarryOverYear?: number | null;
}

// Vacation hours: at most 2 decimals, from `min` to 1000. Like the backend,
// a value can break both rules and then gets both messages.
function hoursErrors(value: unknown, min: number): string[] {
  if (typeof value !== "string") {
    return ["Hours must be a number with at most 2 decimals"];
  }
  const errors: string[] = [];
  if (!HOURS.test(value)) {
    errors.push("Hours must be a number with at most 2 decimals");
  }
  const hours = Number(value);
  if (!(hours >= min && hours <= MAX_VACATION_HOURS)) {
    errors.push(
      min > 0
        ? "Hours must be greater than 0 and at most 1000"
        : "Hours must be between 0 and 1000",
    );
  }
  return errors;
}

// The carry-over year: a whole number from 2000 to 2100, or null. These are
// zod's own messages, as the backend sends them.
function carryOverYearErrors(value: unknown): string[] {
  if (value === null) {
    return [];
  }
  if (typeof value !== "number") {
    return [`Invalid input: expected number, received ${typeof value}`];
  }
  const errors: string[] = [];
  if (!Number.isInteger(value)) {
    errors.push("Invalid input: expected int, received number");
  }
  if (value < 2000) {
    errors.push("Too small: expected number to be >=2000");
  }
  if (value > 2100) {
    errors.push("Too big: expected number to be <=2100");
  }
  return errors;
}

// The job's three vacation fields, each checked only when it is sent. The
// carry-over year is needed as soon as carry-over hours above 0 are sent.
function parseVacationFields(
  input: Record<string, unknown>,
  errors: FieldErrors,
  result: Partial<JobFields>,
) {
  const sent = (key: string) => input[key] !== undefined;

  if (sent("vacationHoursPerYear")) {
    const value = input.vacationHoursPerYear;
    const problems = value === null ? [] : hoursErrors(value, 0.01);
    if (problems.length > 0) {
      errors.vacationHoursPerYear = problems;
    } else {
      result.vacationHoursPerYear =
        value === null ? null : Number(value).toFixed(2);
    }
  }
  if (sent("vacationCarryOverHours")) {
    const problems = hoursErrors(input.vacationCarryOverHours, 0);
    if (problems.length > 0) {
      errors.vacationCarryOverHours = problems;
    } else {
      result.vacationCarryOverHours = Number(
        input.vacationCarryOverHours,
      ).toFixed(2);
    }
  }
  if (sent("vacationCarryOverYear")) {
    const problems = carryOverYearErrors(input.vacationCarryOverYear);
    if (problems.length > 0) {
      errors.vacationCarryOverYear = problems;
    } else {
      result.vacationCarryOverYear = input.vacationCarryOverYear as
        number | null;
    }
  }
  const carriedOver = input.vacationCarryOverHours;
  if (
    typeof carriedOver === "string" &&
    Number(carriedOver) > 0 &&
    input.vacationCarryOverYear == null
  ) {
    errors.vacationCarryOverYear = [
      "Say which year the carried-over hours belong to",
    ];
  }
}

// `partial` is for an update, where only the sent fields are checked.
// A value of the wrong JSON type gets the field's own message, not zod's
// generic one, because the forms never send such values.
export function parseJobBody(body: unknown, partial: boolean) {
  const input = isRecord(body) ? body : {};
  const errors: FieldErrors = {};
  const result: Partial<JobFields> = {};

  if (!partial || "name" in input) {
    const name = typeof input.name === "string" ? input.name.trim() : "";
    if (name.length < 1) {
      errors.name = ["Name is required"];
    } else if (name.length > 100) {
      errors.name = ["Name must be at most 100 characters"];
    } else {
      result.name = name;
    }
  }
  if (!partial || "hourlyRate" in input) {
    const rate = input.hourlyRate;
    if (typeof rate !== "string" || !RATE.test(rate)) {
      errors.hourlyRate = [
        "Hourly rate must be a number with at most 2 decimals",
      ];
    } else if (Number(rate) <= 0) {
      errors.hourlyRate = ["Hourly rate must be greater than 0"];
    } else {
      result.hourlyRate = Number(rate).toFixed(2);
    }
  }
  if (!partial || "type" in input) {
    if (JOB_TYPES.includes(input.type as JobType)) {
      result.type = input.type as JobType;
    } else {
      errors.type = ["Type must be part_time or mini_job"];
    }
  }
  parseVacationFields(input, errors, result);
  if (partial && Object.keys(input).length === 0) {
    errors.name = [EMPTY_UPDATE_MESSAGE];
  }

  if (Object.keys(errors).length > 0) {
    fail(errors);
  }
  return result;
}

type ShiftFields = Omit<ShiftInput, "notes"> & { notes: string | null };

export function parseShiftBody(
  body: unknown,
  partial: boolean,
  current?: ShiftFields,
) {
  const input = isRecord(body) ? body : {};
  const errors: FieldErrors = {};
  const result: Partial<ShiftFields> = {};
  const has = (key: string) => !partial || key in input;

  if (has("jobId")) {
    if (typeof input.jobId === "string" && input.jobId.length > 0) {
      result.jobId = input.jobId;
    } else {
      errors.jobId = ["Job is required"];
    }
  }
  if (has("date")) {
    const problems = calendarDateErrors(input.date);
    if (problems.length > 0) {
      errors.date = problems;
    } else {
      result.date = input.date as string;
    }
  }
  for (const key of ["startTime", "endTime"] as const) {
    if (has(key)) {
      const value = input[key];
      if (typeof value === "string" && CLOCK.test(value)) {
        result[key] = value;
      } else {
        errors[key] = ["Time must be in HH:mm format"];
      }
    }
  }
  if (has("breakMinutes") || (!partial && !("breakMinutes" in input))) {
    const minutes = "breakMinutes" in input ? input.breakMinutes : 0;
    if (typeof minutes !== "number" || !Number.isInteger(minutes)) {
      errors.breakMinutes = ["Break must be a whole number of minutes"];
    } else if (minutes < 0) {
      errors.breakMinutes = ["Break cannot be negative"];
    } else {
      result.breakMinutes = minutes;
    }
  }
  if ("notes" in input) {
    const notes = input.notes;
    if (notes === null || notes === undefined) {
      result.notes = null;
    } else if (typeof notes === "string" && notes.trim().length <= 500) {
      result.notes = notes.trim() === "" ? null : notes.trim();
    } else {
      errors.notes = ["Notes must be at most 500 characters"];
    }
  }
  if (partial && Object.keys(input).length === 0) {
    errors.jobId = [EMPTY_UPDATE_MESSAGE];
  }

  if (Object.keys(errors).length === 0) {
    const startTime = result.startTime ?? current?.startTime;
    const endTime = result.endTime ?? current?.endTime;
    const breakMinutes = result.breakMinutes ?? current?.breakMinutes ?? 0;
    if (startTime && endTime) {
      const length = shiftLengthMinutes(startTime, endTime);
      if (length === 0) {
        errors.endTime = ["End time must be different from start time"];
      } else if (breakMinutes > length) {
        errors.breakMinutes = ["Break cannot be longer than the shift"];
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    fail(errors);
  }
  return result;
}

export interface LeaveFields {
  jobId: string;
  startDate: string;
  endDate: string;
  weekdays: number[];
  minutesPerDay: number;
  notes?: string | null;
  // Create only: delete the job's shifts on the counted days.
  removeOverlappingShifts?: boolean;
}

export type LeaveUpdate = Partial<Omit<LeaveFields, "removeOverlappingShifts">>;

type LeaveDays = Pick<LeaveFields, "startDate" | "endDate" | "weekdays">;

const MINUTES_PER_DAY_MESSAGE =
  "Hours per day must be between 15 minutes and 12 hours";

function areWeekdays(days: readonly unknown[]): days is number[] {
  return days.every(
    (day) =>
      typeof day === "number" && Number.isInteger(day) && day >= 0 && day <= 6,
  );
}

// The days of the week that count, 0 (Sunday) to 6, each at most once.
function weekdayErrors(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [WEEKDAYS_MESSAGE];
  }
  const errors: string[] = [];
  if (value.length === 0 || !areWeekdays(value)) {
    errors.push(WEEKDAYS_MESSAGE);
  }
  if (new Set(value).size !== value.length) {
    errors.push("Each day can only be picked once");
  }
  return errors;
}

function minutesPerDayErrors(value: unknown): string[] {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 15 &&
    value <= 720
    ? []
    : [MINUTES_PER_DAY_MESSAGE];
}

function addIssue(
  errors: FieldErrors,
  issue: { field: string; message: string },
) {
  (errors[issue.field] ??= []).push(issue.message);
}

// A value of the wrong JSON type gets the field's own message, not zod's
// generic one, because the forms never send such values.
// A leave entry: the backend's createLeaveSchema, or for an update
// (`partial`) its updateLeaveSchema, which checks only the sent fields and
// ignores removeOverlappingShifts. With `current`, an update's dates are also
// checked together with the entry's other days, as the backend's service does.
export function parseLeaveBody(body: unknown, partial: false): LeaveFields;
export function parseLeaveBody(
  body: unknown,
  partial: true,
  current?: LeaveDays,
): LeaveUpdate;
export function parseLeaveBody(
  body: unknown,
  partial: boolean,
  current?: LeaveDays,
): LeaveFields | LeaveUpdate {
  const input = isRecord(body) ? body : {};
  const errors: FieldErrors = {};
  const result: Partial<LeaveFields> = {};
  const has = (key: string) => !partial || key in input;

  if (has("jobId")) {
    if (typeof input.jobId === "string" && input.jobId.length > 0) {
      result.jobId = input.jobId;
    } else {
      errors.jobId = ["Job is required"];
    }
  }
  for (const key of ["startDate", "endDate"] as const) {
    if (has(key)) {
      const problems = calendarDateErrors(input[key]);
      if (problems.length > 0) {
        errors[key] = problems;
      } else {
        result[key] = input[key] as string;
      }
    }
  }
  if (has("weekdays")) {
    const problems = weekdayErrors(input.weekdays);
    if (problems.length > 0) {
      errors.weekdays = problems;
    } else {
      result.weekdays = [...(input.weekdays as number[])];
    }
  }
  if (has("minutesPerDay")) {
    const problems = minutesPerDayErrors(input.minutesPerDay);
    if (problems.length > 0) {
      errors.minutesPerDay = problems;
    } else {
      result.minutesPerDay = input.minutesPerDay as number;
    }
  }
  if ("notes" in input) {
    const notes = input.notes;
    if (notes === null || notes === undefined) {
      result.notes = null;
    } else if (typeof notes === "string" && notes.trim().length <= 500) {
      result.notes = notes.trim() === "" ? null : notes.trim();
    } else {
      errors.notes = ["Notes must be at most 500 characters"];
    }
  }
  if (!partial && input.removeOverlappingShifts !== undefined) {
    if (typeof input.removeOverlappingShifts === "boolean") {
      result.removeOverlappingShifts = input.removeOverlappingShifts;
    } else {
      errors.removeOverlappingShifts = [
        "Invalid input: expected boolean, received " +
          typeof input.removeOverlappingShifts,
      ];
    }
  }

  if (!partial) {
    // Like the backend, the rules across fields run on real dates and valid
    // weekdays even when another field failed, and both are reported.
    const weekdays = input.weekdays;
    if (
      result.startDate &&
      result.endDate &&
      Array.isArray(weekdays) &&
      weekdays.length > 0 &&
      areWeekdays(weekdays)
    ) {
      const issue = validateLeaveDates({
        startDate: result.startDate,
        endDate: result.endDate,
        weekdays,
      });
      if (issue) {
        addIssue(errors, issue);
      }
    }
  } else if (Object.keys(errors).length === 0) {
    if (Object.keys(result).length === 0) {
      errors.form = [EMPTY_UPDATE_MESSAGE];
    } else if (current) {
      const issue = validateLeaveDates({
        startDate: result.startDate ?? current.startDate,
        endDate: result.endDate ?? current.endDate,
        weekdays: result.weekdays ?? current.weekdays,
      });
      if (issue) {
        addIssue(errors, issue);
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    fail(errors);
  }
  return result;
}

export interface LeaveQuery {
  from?: string;
  to?: string;
  jobId?: string;
}

// The backend's listLeaveQuerySchema.
export function parseLeaveQuery(query: URLSearchParams): LeaveQuery {
  const errors: FieldErrors = {};
  const result: LeaveQuery = {};

  for (const key of ["from", "to"] as const) {
    const value = query.get(key);
    if (value !== null) {
      const problems = calendarDateErrors(value);
      if (problems.length > 0) {
        errors[key] = problems;
      } else {
        result[key] = value;
      }
    }
  }
  const jobId = query.get("jobId");
  if (jobId !== null) {
    if (jobId.length > 0) {
      result.jobId = jobId;
    } else {
      errors.jobId = ["Job is required"];
    }
  }
  if (result.from && result.to && result.from > result.to) {
    errors.to = ["From date must not be after the to date"];
  }

  if (Object.keys(errors).length > 0) {
    fail(errors);
  }
  return result;
}
