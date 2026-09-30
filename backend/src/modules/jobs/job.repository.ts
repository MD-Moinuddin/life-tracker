import type { JobType } from "../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";

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

export function updateJob(id: string, data: Partial<JobData>) {
  return prisma.job.update({ where: { id }, data });
}

export function deleteJob(id: string) {
  return prisma.job.delete({ where: { id } });
}
