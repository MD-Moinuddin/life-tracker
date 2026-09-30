import { validateShiftTimes } from "./shift.schema";
import type { CreateShiftInput, UpdateShiftInput } from "./shift.schema";
import { shiftEndDate, workedMinutes } from "../../lib/shift-time";
import * as jobRepository from "../jobs/job.repository";
import { JobNotFoundError } from "../jobs/job.service";
import * as repository from "./shift.repository";

export class ShiftNotFoundError extends Error {
  constructor() {
    super("Shift not found");
    this.name = "ShiftNotFoundError";
  }
}

export class InvalidShiftError extends Error {
  constructor(
    readonly field: string,
    message: string,
  ) {
    super(message);
    this.name = "InvalidShiftError";
  }
}

type ShiftRow = NonNullable<
  Awaited<ReturnType<typeof repository.findShiftByIdForUser>>
>;

function toShiftResponse(shift: ShiftRow) {
  const date = shift.date.toISOString().slice(0, 10);
  return {
    id: shift.id,
    jobId: shift.jobId,
    job: {
      id: shift.job.id,
      name: shift.job.name,
      hourlyRate: shift.job.hourlyRate.toFixed(2),
      type: shift.job.type,
    },
    date,
    startTime: shift.startTime,
    endTime: shift.endTime,
    endDate: shiftEndDate(date, shift.startTime, shift.endTime),
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

async function requireOwnedJob(jobId: string, userId: string) {
  const job = await jobRepository.findJobByIdForUser(jobId, userId);
  if (!job) {
    throw new JobNotFoundError();
  }
}

async function requireOwnedShift(id: string, userId: string) {
  const shift = await repository.findShiftByIdForUser(id, userId);
  if (!shift) {
    throw new ShiftNotFoundError();
  }
  return shift;
}

export async function listShifts(
  userId: string,
  range: { from?: string; to?: string } = {},
) {
  const shifts = await repository.listShiftsByUser(userId, range);
  return shifts.map(toShiftResponse);
}

export async function createShift(userId: string, input: CreateShiftInput) {
  await requireOwnedJob(input.jobId, userId);
  const shift = await repository.createShift(input);
  return toShiftResponse(shift);
}

export async function updateShift(
  userId: string,
  id: string,
  input: UpdateShiftInput,
) {
  const existing = await requireOwnedShift(id, userId);

  if (input.jobId && input.jobId !== existing.jobId) {
    await requireOwnedJob(input.jobId, userId);
  }

  const issue = validateShiftTimes({
    startTime: input.startTime ?? existing.startTime,
    endTime: input.endTime ?? existing.endTime,
    breakMinutes: input.breakMinutes ?? existing.breakMinutes,
  });
  if (issue) {
    throw new InvalidShiftError(issue.field, issue.message);
  }

  const shift = await repository.updateShift(id, input);
  return toShiftResponse(shift);
}

export async function deleteShift(userId: string, id: string) {
  await requireOwnedShift(id, userId);
  await repository.deleteShift(id);
}
