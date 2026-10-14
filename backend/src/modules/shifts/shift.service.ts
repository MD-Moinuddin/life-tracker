import { NotFoundError, ValidationError } from "../../lib/errors";
import { shiftEndDate, workedMinutes } from "../../lib/shift-time";
import { assertJobOwned } from "../jobs/job.service";
import * as repository from "./shift.repository";
import { validateShiftTimes } from "./shift.schema";
import type {
  CreateShiftInput,
  ListShiftsQuery,
  UpdateShiftInput,
} from "./shift.schema";

export class ShiftNotFoundError extends NotFoundError {
  constructor() {
    super("Shift not found");
  }
}

export class InvalidShiftError extends ValidationError {
  constructor(field: string, message: string) {
    super({ [field]: [message] });
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

async function requireOwnedShift(id: string, userId: string) {
  const shift = await repository.findShiftByIdForUser(id, userId);
  if (!shift) {
    throw new ShiftNotFoundError();
  }
  return shift;
}

export async function listShifts(userId: string, query: ListShiftsQuery) {
  const { limit, offset, ...range } = query;
  const { items, total } = await repository.listShiftsPageByUser(
    userId,
    range,
    { limit, offset },
  );
  return { items: items.map(toShiftResponse), total, limit, offset };
}

export async function listShiftsInRange(
  userId: string,
  range: { from: string; to: string },
) {
  const shifts = await repository.listShiftsByUser(userId, range);
  return shifts.map(toShiftResponse);
}

export async function createShift(userId: string, input: CreateShiftInput) {
  await assertJobOwned(userId, input.jobId);
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
    await assertJobOwned(userId, input.jobId);
  }

  const issue = validateShiftTimes({
    startTime: input.startTime ?? existing.startTime,
    endTime: input.endTime ?? existing.endTime,
    breakMinutes: input.breakMinutes ?? existing.breakMinutes,
  });
  if (issue) {
    throw new InvalidShiftError(issue.field, issue.message);
  }

  const shift = await repository.updateShiftForUser(id, userId, input);
  if (!shift) {
    throw new ShiftNotFoundError();
  }
  return toShiftResponse(shift);
}

export async function deleteShift(userId: string, id: string) {
  const deleted = await repository.deleteShiftForUser(id, userId);
  if (!deleted) {
    throw new ShiftNotFoundError();
  }
}
