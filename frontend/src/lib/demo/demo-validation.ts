import { ApiError } from "../api-client";
import type { FieldErrors } from "../api-client";
import type { JobType } from "../jobs-api";
import { shiftLengthMinutes } from "../shift-time";
import type { ShiftInput } from "../shifts-api";

// The same rules as the backend's job and shift schemas, so the demo refuses
// what the real app would refuse and the forms show the same messages.

const JOB_TYPES: readonly JobType[] = ["part_time", "mini_job"];
const RATE = /^\d{1,6}(\.\d{1,2})?$/;
const CLOCK = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

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

export interface JobFields {
  name: string;
  hourlyRate: string;
  type: JobType;
}

// `partial` is for an update, where only the sent fields are checked.
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
  if (partial && Object.keys(input).length === 0) {
    errors.name = ["Provide at least one field to update"];
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
    if (typeof input.date === "string" && isRealDate(input.date)) {
      result.date = input.date;
    } else {
      errors.date = ["Date must be a real date in YYYY-MM-DD format"];
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
    errors.jobId = ["Provide at least one field to update"];
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
