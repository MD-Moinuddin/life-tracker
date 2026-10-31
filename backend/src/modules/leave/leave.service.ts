import { NotFoundError, ValidationError } from "../../lib/errors";
import { countedDays } from "../../lib/leave-days";
import { findJobByIdForUser } from "../jobs/job.repository";
import { JobNotFoundError } from "../jobs/job.service";
import * as repository from "./leave.repository";
import { validateLeaveDates } from "./leave.schema";
import type {
  CreateLeaveInput,
  ListLeaveQuery,
  UpdateLeaveInput,
} from "./leave.schema";

export class LeaveNotFoundError extends NotFoundError {
  constructor() {
    super("Leave not found");
  }
}

export class InvalidLeaveError extends ValidationError {
  constructor(field: string, message: string) {
    super({ [field]: [message] });
  }
}

export class VacationNotTrackedError extends ValidationError {
  constructor() {
    super({ jobId: ["Turn on paid vacation for this job first"] });
  }
}

export class LeaveOverlapError extends ValidationError {
  constructor() {
    super({ startDate: ["These days already have paid leave"] });
  }
}

type LeaveRow = NonNullable<
  Awaited<ReturnType<typeof repository.findLeaveByIdForUser>>
>;

interface LeaveDays {
  startDate: string;
  endDate: string;
  weekdays: number[];
}

// A @db.Date value is UTC midnight, so its UTC date part is the calendar date.
function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function toLeaveResponse(leave: LeaveRow) {
  return {
    id: leave.id,
    jobId: leave.jobId,
    job: {
      id: leave.job.id,
      name: leave.job.name,
      hourlyRate: leave.job.hourlyRate.toFixed(2),
      type: leave.job.type,
    },
    type: leave.type,
    startDate: isoDate(leave.startDate),
    endDate: isoDate(leave.endDate),
    weekdays: leave.weekdays,
    minutesPerDay: leave.minutesPerDay,
    notes: leave.notes,
    createdAt: leave.createdAt,
    updatedAt: leave.updatedAt,
  };
}

export type LeaveResponse = ReturnType<typeof toLeaveResponse>;

async function requireOwnedLeave(id: string, userId: string) {
  const leave = await repository.findLeaveByIdForUser(id, userId);
  if (!leave) {
    throw new LeaveNotFoundError();
  }
  return leave;
}

// The job must be the user's (404 otherwise, so nothing leaks) and must
// track paid vacation.
async function requireVacationJob(userId: string, jobId: string) {
  const job = await findJobByIdForUser(jobId, userId);
  if (!job) {
    throw new JobNotFoundError();
  }
  if (job.vacationHoursPerYear === null) {
    throw new VacationNotTrackedError();
  }
  return job;
}

// Only counted days conflict: two entries of the same job may share a date
// range as long as no date counts in both. `exceptId` skips the entry being
// edited.
async function assertNoOverlap(
  jobId: string,
  leave: LeaveDays,
  exceptId?: string,
) {
  const mine = new Set(
    countedDays(leave.startDate, leave.endDate, leave.weekdays),
  );
  const others = await repository.listLeaveOfJobOverlapping(
    jobId,
    leave.startDate,
    leave.endDate,
  );
  for (const other of others) {
    if (other.id === exceptId) {
      continue;
    }
    const theirs = countedDays(
      isoDate(other.startDate),
      isoDate(other.endDate),
      other.weekdays,
    );
    if (theirs.some((day) => mine.has(day))) {
      throw new LeaveOverlapError();
    }
  }
}

export async function listLeave(userId: string, query: ListLeaveQuery) {
  const leave = await repository.listLeaveByUser(userId, query);
  return leave.map(toLeaveResponse);
}

// The leave that counts in the Summary: a job that stops tracking vacation
// keeps its leave, but it is ignored until tracking is turned on again.
export async function listLeaveInRange(
  userId: string,
  range: { from: string; to: string },
): Promise<LeaveResponse[]> {
  const leave = await repository.listLeaveByUser(userId, {
    ...range,
    trackedOnly: true,
  });
  return leave.map(toLeaveResponse);
}

export async function createLeave(userId: string, input: CreateLeaveInput) {
  const { removeOverlappingShifts, ...data } = input;
  await requireVacationJob(userId, data.jobId);
  await assertNoOverlap(data.jobId, data);

  if (!removeOverlappingShifts) {
    return toLeaveResponse(await repository.createLeave(data));
  }

  const { leave, removedShifts } = await repository.createLeaveRemovingShifts(
    data,
    countedDays(data.startDate, data.endDate, data.weekdays),
  );
  return { ...toLeaveResponse(leave), removedShifts };
}

export async function updateLeave(
  userId: string,
  id: string,
  input: UpdateLeaveInput,
) {
  const existing = await requireOwnedLeave(id, userId);

  const merged = {
    jobId: input.jobId ?? existing.jobId,
    startDate: input.startDate ?? isoDate(existing.startDate),
    endDate: input.endDate ?? isoDate(existing.endDate),
    weekdays: input.weekdays ?? existing.weekdays,
  };
  const issue = validateLeaveDates(merged);
  if (issue) {
    throw new InvalidLeaveError(issue.field, issue.message);
  }
  await requireVacationJob(userId, merged.jobId);
  await assertNoOverlap(merged.jobId, merged, existing.id);

  const leave = await repository.updateLeaveForUser(id, userId, input);
  if (!leave) {
    throw new LeaveNotFoundError();
  }
  return toLeaveResponse(leave);
}

export async function deleteLeave(userId: string, id: string) {
  const deleted = await repository.deleteLeaveForUser(id, userId);
  if (!deleted) {
    throw new LeaveNotFoundError();
  }
}
