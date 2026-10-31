import { ApiError } from "../api-client";
import type { ApiFetchOptions } from "../api-client";
import type { Job, JobWithShiftCount } from "../jobs-api";
import { shiftEndDate, workedMinutes } from "../shift-time";
import type { Shift, ShiftPage } from "../shifts-api";
import type { SummaryRange } from "../summary-period";
import { demoDb, nextDemoId } from "./demo-db";
import type { DemoJob, DemoShift } from "./demo-db";
import { buildDemoSummary } from "./demo-summary";
import { parseJobBody, parseShiftBody } from "./demo-validation";
import type { JobFields } from "./demo-validation";

// The demo's answer to every API call the app makes. The pages cannot tell it
// from the real backend: same paths, same shapes, same errors.

type Body = Pick<ApiFetchOptions, "method" | "body">;

const DEFAULT_PAGE_SIZE = 100;
const MAX_PAGE_SIZE = 500;

function notFound(what: string): never {
  throw new ApiError(404, `${what} not found`);
}

// The demo does not track paid vacation yet, so every job reports that.
function toJob(job: DemoJob): Job {
  return {
    ...job,
    vacationHoursPerYear: null,
    vacationCarryOverHours: "0.00",
    vacationCarryOverYear: null,
  };
}

function toShift(shift: DemoShift): Shift {
  const job = demoDb.jobs.find((candidate) => candidate.id === shift.jobId);
  if (!job) {
    return notFound("Job");
  }
  return {
    id: shift.id,
    jobId: shift.jobId,
    job: {
      id: job.id,
      name: job.name,
      hourlyRate: job.hourlyRate,
      type: job.type,
    },
    date: shift.date,
    startTime: shift.startTime,
    endTime: shift.endTime,
    endDate: shiftEndDate(shift.date, shift.startTime, shift.endTime),
    breakMinutes: shift.breakMinutes,
    workedMinutes: workedMinutes(
      shift.startTime,
      shift.endTime,
      shift.breakMinutes,
    ),
    notes: shift.notes,
    createdAt: shift.createdAt,
    updatedAt: shift.updatedAt,
  };
}

function sortedShifts(): Shift[] {
  return demoDb.shifts
    .map(toShift)
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        a.startTime.localeCompare(b.startTime) ||
        a.id.localeCompare(b.id),
    );
}

function requireJob(id: string): DemoJob {
  return demoDb.jobs.find((job) => job.id === id) ?? notFound("Job");
}

function requireShift(id: string): DemoShift {
  return demoDb.shifts.find((shift) => shift.id === id) ?? notFound("Shift");
}

const now = () => new Date().toISOString();

function listJobs(): JobWithShiftCount[] {
  return demoDb.jobs.map((job) => ({
    ...toJob(job),
    shiftCount: demoDb.shifts.filter((shift) => shift.jobId === job.id).length,
  }));
}

function createJob(body: unknown): Job {
  const fields = parseJobBody(body, false) as JobFields;
  const stamp = now();
  const job: DemoJob = {
    id: nextDemoId("demo-job"),
    ...fields,
    createdAt: stamp,
    updatedAt: stamp,
  };
  demoDb.jobs.push(job);
  return toJob(job);
}

function updateJob(id: string, body: unknown): Job {
  const job = requireJob(id);
  Object.assign(job, parseJobBody(body, true), { updatedAt: now() });
  return toJob(job);
}

function deleteJob(id: string): void {
  requireJob(id);
  demoDb.jobs = demoDb.jobs.filter((job) => job.id !== id);
  // Like the database, deleting a job deletes its shifts.
  demoDb.shifts = demoDb.shifts.filter((shift) => shift.jobId !== id);
}

function listShifts(query: URLSearchParams): ShiftPage {
  const from = query.get("from");
  const to = query.get("to");
  const jobId = query.get("jobId");
  const limit = Math.min(
    Number(query.get("limit") ?? DEFAULT_PAGE_SIZE) || DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE,
  );
  const offset = Number(query.get("offset") ?? 0) || 0;

  const matching = sortedShifts().filter(
    (shift) =>
      (!from || shift.date >= from) &&
      (!to || shift.date <= to) &&
      (!jobId || shift.jobId === jobId),
  );
  return {
    items: matching.slice(offset, offset + limit),
    total: matching.length,
    limit,
    offset,
  };
}

function createShift(body: unknown): Shift {
  const fields = parseShiftBody(body, false) as Required<
    Pick<DemoShift, "jobId" | "date" | "startTime" | "endTime" | "breakMinutes">
  > & { notes?: string | null };
  requireJob(fields.jobId);
  const stamp = now();
  const shift: DemoShift = {
    id: nextDemoId("demo-shift"),
    ...fields,
    notes: fields.notes ?? null,
    createdAt: stamp,
    updatedAt: stamp,
  };
  demoDb.shifts.push(shift);
  return toShift(shift);
}

function updateShift(id: string, body: unknown): Shift {
  const shift = requireShift(id);
  const fields = parseShiftBody(body, true, shift);
  if (fields.jobId) {
    requireJob(fields.jobId);
  }
  Object.assign(shift, fields, { updatedAt: now() });
  return toShift(shift);
}

function deleteShift(id: string): void {
  requireShift(id);
  demoDb.shifts = demoDb.shifts.filter((shift) => shift.id !== id);
}

function getSummary(query: URLSearchParams) {
  const range = query.get("range");
  const date = query.get("date");
  const at = query.get("now");
  if ((range !== "week" && range !== "month") || !date || !at) {
    throw new ApiError(400, "Validation failed", {
      range: ["Range must be week or month"],
    });
  }
  return buildDemoSummary({
    shifts: sortedShifts(),
    range: range as SummaryRange,
    date,
    now: at,
  });
}

function route(method: string, path: string, body: unknown): unknown {
  const url = new URL(path, "http://demo.local");
  const [, resource, encodedId] = url.pathname.split("/");
  const id =
    encodedId === undefined ? undefined : decodeURIComponent(encodedId);
  const isCollection = id === undefined;

  if (resource === "jobs") {
    if (isCollection && method === "GET") return listJobs();
    if (isCollection && method === "POST") return createJob(body);
    if (!isCollection && method === "PATCH") return updateJob(id, body);
    if (!isCollection && method === "DELETE") return deleteJob(id);
  }
  if (resource === "shifts") {
    if (isCollection && method === "GET") return listShifts(url.searchParams);
    if (isCollection && method === "POST") return createShift(body);
    if (!isCollection && method === "PATCH") return updateShift(id, body);
    if (!isCollection && method === "DELETE") return deleteShift(id);
  }
  if (resource === "summary" && isCollection && method === "GET") {
    return getSummary(url.searchParams);
  }
  return notFound("Route");
}

// Answers like authedFetch would, from the in-memory demo data. Results are
// copied, so the pages can never change the demo data by accident.
export async function demoFetch<T>(
  path: string,
  options: Body = {},
): Promise<T> {
  const result = route(
    (options.method ?? "GET").toUpperCase(),
    path.replace(/^\/api/, ""),
    options.body,
  );
  return (result === undefined ? undefined : structuredClone(result)) as T;
}
