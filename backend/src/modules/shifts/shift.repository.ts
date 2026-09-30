import type { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { hasPrismaCode } from "../../lib/prisma-errors";

interface ShiftData {
  jobId: string;
  date: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  notes?: string | null;
}

const withJob = {
  job: { select: { id: true, name: true, hourlyRate: true, type: true } },
} as const;

// A @db.Date column holds a calendar date, so UTC midnight keeps it from
// shifting with the server's time zone.
function toDbDate(date: string) {
  return new Date(`${date}T00:00:00Z`);
}

const shiftOrder: Prisma.ShiftOrderByWithRelationInput[] = [
  { date: "asc" },
  { startTime: "asc" },
  { id: "asc" },
];

function shiftWhere(
  userId: string,
  range: { from?: string; to?: string },
): Prisma.ShiftWhereInput {
  return {
    job: { userId },
    date: {
      ...(range.from ? { gte: toDbDate(range.from) } : {}),
      ...(range.to ? { lte: toDbDate(range.to) } : {}),
    },
  };
}

export function listShiftsByUser(
  userId: string,
  range: { from?: string; to?: string } = {},
) {
  return prisma.shift.findMany({
    where: shiftWhere(userId, range),
    include: withJob,
    orderBy: shiftOrder,
  });
}

export async function listShiftsPageByUser(
  userId: string,
  range: { from?: string; to?: string },
  page: { limit: number; offset: number },
) {
  const where = shiftWhere(userId, range);
  const [items, total] = await prisma.$transaction([
    prisma.shift.findMany({
      where,
      include: withJob,
      orderBy: shiftOrder,
      take: page.limit,
      skip: page.offset,
    }),
    prisma.shift.count({ where }),
  ]);
  return { items, total };
}

export function findShiftByIdForUser(id: string, userId: string) {
  return prisma.shift.findFirst({
    where: { id, job: { userId } },
    include: withJob,
  });
}

export function createShift(data: ShiftData) {
  return prisma.shift.create({
    data: { ...data, date: toDbDate(data.date) },
    include: withJob,
  });
}

export async function updateShiftForUser(
  id: string,
  userId: string,
  data: Partial<ShiftData>,
) {
  const { date, ...rest } = data;
  try {
    return await prisma.shift.update({
      where: { id, job: { userId } },
      data: { ...rest, ...(date ? { date: toDbDate(date) } : {}) },
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

export async function deleteShiftForUser(id: string, userId: string) {
  const { count } = await prisma.shift.deleteMany({
    where: { id, job: { userId } },
  });
  return count > 0;
}
