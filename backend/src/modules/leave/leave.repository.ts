import { prisma } from "../../lib/prisma";
import { hasPrismaCode } from "../../lib/prisma-errors";

export interface LeaveData {
  jobId: string;
  startDate: string;
  endDate: string;
  weekdays: number[];
  minutesPerDay: number;
  notes?: string | null;
}

interface LeaveFilter {
  from?: string;
  to?: string;
  jobId?: string;
  // Only leave of jobs that track paid vacation (vacationHoursPerYear set).
  trackedOnly?: boolean;
}

const withJob = {
  job: { select: { id: true, name: true, hourlyRate: true, type: true } },
} as const;

// A @db.Date column holds a calendar date, so UTC midnight keeps it from
// shifting with the server's time zone.
function toDbDate(date: string) {
  return new Date(`${date}T00:00:00Z`);
}

function toDbData(data: Partial<LeaveData>) {
  const { startDate, endDate, ...rest } = data;
  return {
    ...rest,
    ...(startDate ? { startDate: toDbDate(startDate) } : {}),
    ...(endDate ? { endDate: toDbDate(endDate) } : {}),
  };
}

function toCreateData(data: LeaveData) {
  return {
    ...data,
    startDate: toDbDate(data.startDate),
    endDate: toDbDate(data.endDate),
  };
}

// Leave that overlaps [from, to]: it starts on or before `to` and ends on or
// after `from`.
export function listLeaveByUser(userId: string, filter: LeaveFilter = {}) {
  return prisma.leave.findMany({
    where: {
      job: {
        userId,
        ...(filter.trackedOnly ? { vacationHoursPerYear: { not: null } } : {}),
      },
      ...(filter.jobId ? { jobId: filter.jobId } : {}),
      ...(filter.to ? { startDate: { lte: toDbDate(filter.to) } } : {}),
      ...(filter.from ? { endDate: { gte: toDbDate(filter.from) } } : {}),
    },
    include: withJob,
    orderBy: [{ startDate: "asc" }, { id: "asc" }],
  });
}

export function findLeaveByIdForUser(id: string, userId: string) {
  return prisma.leave.findFirst({
    where: { id, job: { userId } },
    include: withJob,
  });
}

// Leave of one job whose range overlaps [start, end], for the overlap check.
export function listLeaveOfJobOverlapping(
  jobId: string,
  start: string,
  end: string,
) {
  return prisma.leave.findMany({
    where: {
      jobId,
      startDate: { lte: toDbDate(end) },
      endDate: { gte: toDbDate(start) },
    },
  });
}

export function createLeave(data: LeaveData) {
  return prisma.leave.create({ data: toCreateData(data), include: withJob });
}

// Creates the leave and deletes the job's shifts on the given dates in one
// transaction, so neither happens without the other.
export function createLeaveRemovingShifts(
  data: LeaveData,
  shiftDates: string[],
) {
  return prisma.$transaction(async (tx) => {
    const leave = await tx.leave.create({
      data: toCreateData(data),
      include: withJob,
    });
    const removed = shiftDates.length
      ? await tx.shift.deleteMany({
          where: { jobId: data.jobId, date: { in: shiftDates.map(toDbDate) } },
        })
      : { count: 0 };
    return { leave, removedShifts: removed.count };
  });
}

export async function updateLeaveForUser(
  id: string,
  userId: string,
  data: Partial<LeaveData>,
) {
  try {
    return await prisma.leave.update({
      where: { id, job: { userId } },
      data: toDbData(data),
      include: withJob,
    });
  } catch (error) {
    // Prisma throws P2025 when no row matches; report that as null.
    if (hasPrismaCode(error, "P2025")) {
      return null;
    }
    throw error;
  }
}

export async function deleteLeaveForUser(id: string, userId: string) {
  const { count } = await prisma.leave.deleteMany({
    where: { id, job: { userId } },
  });
  return count > 0;
}
