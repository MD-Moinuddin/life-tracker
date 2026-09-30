import type { Job } from "../../generated/prisma/client";
import * as repository from "./job.repository";
import type { CreateJobInput, UpdateJobInput } from "./job.schema";

export class JobNotFoundError extends Error {
  constructor() {
    super("Job not found");
    this.name = "JobNotFoundError";
  }
}

function toJobResponse(job: Job) {
  return {
    id: job.id,
    name: job.name,
    hourlyRate: job.hourlyRate.toFixed(2),
    type: job.type,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}

async function requireOwnedJob(id: string, userId: string) {
  const job = await repository.findJobByIdForUser(id, userId);
  if (!job) {
    throw new JobNotFoundError();
  }
  return job;
}

export async function listJobs(userId: string) {
  const jobs = await repository.listJobsByUser(userId);
  return jobs.map((job) => ({
    ...toJobResponse(job),
    shiftCount: job._count.shifts,
  }));
}

export async function createJob(userId: string, input: CreateJobInput) {
  const job = await repository.createJob(userId, input);
  return toJobResponse(job);
}

export async function updateJob(
  userId: string,
  id: string,
  input: UpdateJobInput,
) {
  await requireOwnedJob(id, userId);
  const job = await repository.updateJob(id, input);
  return toJobResponse(job);
}

export async function deleteJob(userId: string, id: string) {
  await requireOwnedJob(id, userId);
  await repository.deleteJob(id);
}
