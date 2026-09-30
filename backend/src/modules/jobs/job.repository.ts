import type { JobType } from "../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { hasPrismaCode } from "../../lib/prisma-errors";

interface JobData {
  name: string;
  hourlyRate: string;
  type: JobType;
}

export function listJobsByUser(userId: string) {
  return prisma.job.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { shifts: true } } },
  });
}

export function findJobByIdForUser(id: string, userId: string) {
  return prisma.job.findFirst({ where: { id, userId } });
}

export function createJob(userId: string, data: JobData) {
  return prisma.job.create({ data: { ...data, userId } });
}

export async function updateJobForUser(
  id: string,
  userId: string,
  data: Partial<JobData>,
) {
  try {
    return await prisma.job.update({ where: { id, userId }, data });
  } catch (error) {
    // Prisma throws P2025 when no row matches; report that as null.
    if (hasPrismaCode(error, "P2025")) {
      return null;
    }
    throw error;
  }
}

export async function deleteJobForUser(id: string, userId: string) {
  const { count } = await prisma.job.deleteMany({ where: { id, userId } });
  return count > 0;
}
