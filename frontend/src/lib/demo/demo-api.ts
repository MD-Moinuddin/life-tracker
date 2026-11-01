import { ApiError } from "../api-client";
import type { ApiFetchOptions } from "../api-client";
import type { Job, JobWithShiftCount } from "../jobs-api";
import type { Leave } from "../leave-api";
import { countedDays } from "../leave-days";
import { shiftEndDate, workedMinutes } from "../shift-time";
import type { Shift, ShiftPage } from "../shifts-api";
import type { SummaryRange } from "../summary-period";
import { tracksVacation } from "../vacation";
import { demoDb, NO_VACATION, nextDemoId } from "./demo-db";
import type { DemoJob, DemoLeave, DemoShift } from "./demo-db";
import { buildDemoSummary } from "./demo-summary";
import {
  parseJobBody,
  parseLeaveBody,
  parseLeaveQuery,
  parseShiftBody,
} from "./demo-validation";
import type { JobFields } from "./demo-validation";

// The demo's answer to every API call the app makes. The pages cannot tell it
// from the real backend: same paths, same shapes, same errors.

type Body = Pick<ApiFetchOptions, "method" | "body">;

const DEFAULT_PAGE_SIZE = 100;
const MAX_PAGE_SIZE = 500;

function notFound(what: string): never {
  throw new ApiError(404, `${what} not found`);
}

function validationError(field: string, message: string): never {
  throw new ApiError(400, "Validation failed", { [field]: [message] });
}

// The job as a shift or a leave entry carries it.
function jobSummary(jobId: string): Shift["job"] {
  const job = demoDb.jobs.find((candidate) => candidate.id === jobId);
  if (!job) {
    return notFound("Job");
  }
  return {
    id: job.id,
    name: job.name,
    hourlyRate: job.hourlyRate,
    type: job.type,
  };
}

function toShift(shift: DemoShift): Shift {
  return {
    id: shift.id,
    jobId: shift.jobId,
    job: jobSummary(shift.jobId),
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
    ...job,
    shiftCount: demoDb.shifts.filter((shift) => shift.jobId === job.id).length,
  }));
}

function createJob(body: unknown): Job {
  const fields = parseJobBody(body, false) as JobFields;
  const stamp = now();
  const job: DemoJob = {
    id: nextDemoId("demo-job"),
    ...NO_VACATION,
    ...fields,
    createdAt: stamp,
    updatedAt: stamp,
  };
  demoDb.jobs.push(job);
  return job;
}

function updateJob(id: string, body: unknown): Job {
  const job = requireJob(id);
  Object.assign(job, parseJobBody(body, true), { updatedAt: now() });
  return job;
}

function deleteJob(id: string): void {
  requireJob(id);
  demoDb.jobs = demoDb.jobs.filter((job) => job.id !== id);
  // Like the database, deleting a job deletes its shifts and its leave.
  demoDb.shifts = demoDb.shifts.filter((shift) => shift.jobId !== id);
  demoDb.leave = demoDb.leave.filter((entry) => entry.jobId !== id);
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

function toLeave(leave: DemoLeave): Leave {
  return { ...leave, job: jobSummary(leave.jobId) };
}

// In start order, like the backend.
function sortedLeave(): Leave[] {
  return demoDb.leave
    .map(toLeave)
    .sort(
      (a, b) =>
        a.startDate.localeCompare(b.startDate) || a.id.localeCompare(b.id),
    );
}

function requireLeave(id: string): DemoLeave {
  return demoDb.leave.find((entry) => entry.id === id) ?? notFound("Leave");
}

// The job must exist (404 otherwise) and must track paid vacation.
function requireVacationJob(jobId: string): DemoJob {
  const job = requireJob(jobId);
  if (!tracksVacation(job)) {
    return validationError("jobId", "Turn on paid vacation for this job first");
  }
  return job;
}

// Only counted days conflict: two entries of the same job may share a date
// range as long as no date counts in both. `exceptId` skips the entry being
// edited. The backend's assertNoOverlap.
function assertNoOverlap(
  jobId: string,
  leave: Pick<DemoLeave, "startDate" | "endDate" | "weekdays">,
  exceptId?: string,
) {
  const mine = new Set(
    countedDays(leave.startDate, leave.endDate, leave.weekdays),
  );
  const clash = demoDb.leave.some(
    (other) =>
      other.jobId === jobId &&
      other.id !== exceptId &&
      countedDays(other.startDate, other.endDate, other.weekdays).some((day) =>
        mine.has(day),
      ),
  );
  if (clash) {
    validationError("startDate", "These days already have paid leave");
  }
}

// Leave that overlaps [from, to]: it starts on or before `to` and ends on or
// after `from`. It includes the leave of jobs that stopped tracking vacation,
// as the backend does; the pages leave that out themselves.
function listLeave(query: URLSearchParams): Leave[] {
  const { from, to, jobId } = parseLeaveQuery(query);
  return sortedLeave().filter(
    (entry) =>
      (!to || entry.startDate <= to) &&
      (!from || entry.endDate >= from) &&
      (!jobId || entry.jobId === jobId),
  );
}

function createLeave(body: unknown): Leave & { removedShifts?: number } {
  const { removeOverlappingShifts, ...fields } = parseLeaveBody(body, false);
  requireVacationJob(fields.jobId);
  assertNoOverlap(fields.jobId, fields);
  const stamp = now();
  const leave: DemoLeave = {
    id: nextDemoId("demo-leave"),
    type: "paid_vacation",
    ...fields,
    notes: fields.notes ?? null,
    createdAt: stamp,
    updatedAt: stamp,
  };
  demoDb.leave.push(leave);
  if (!removeOverlappingShifts) {
    return toLeave(leave);
  }
  // The job's shifts on the counted days go in the same step.
  const days = new Set(
    countedDays(leave.startDate, leave.endDate, leave.weekdays),
  );
  const before = demoDb.shifts.length;
  demoDb.shifts = demoDb.shifts.filter(
    (shift) => shift.jobId !== leave.jobId || !days.has(shift.date),
  );
  return { ...toLeave(leave), removedShifts: before - demoDb.shifts.length };
}

// The backend's order: the body's own fields, then whether the entry exists,
// then the merged dates, the job and the overlap.
function updateLeave(id: string, body: unknown): Leave {
  const current = demoDb.leave.find((entry) => entry.id === id);
  const fields = parseLeaveBody(body, true, current);
  if (!current) {
    return notFound("Leave");
  }
  const merged = { ...current, ...fields };
  requireVacationJob(merged.jobId);
  assertNoOverlap(merged.jobId, merged, current.id);
  Object.assign(current, fields, { updatedAt: now() });
  return toLeave(current);
}

function deleteLeave(id: string): void {
  requireLeave(id);
  demoDb.leave = demoDb.leave.filter((entry) => entry.id !== id);
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
    // Like the backend, only the leave of jobs that track paid vacation.
    leave: sortedLeave().filter((entry) =>
      tracksVacation(requireJob(entry.jobId)),
    ),
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
  if (resource === "leave") {
    if (isCollection && method === "GET") return listLeave(url.searchParams);
    if (isCollection && method === "POST") return createLeave(body);
    if (!isCollection && method === "PATCH") return updateLeave(id, body);
    if (!isCollection && method === "DELETE") return deleteLeave(id);
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
