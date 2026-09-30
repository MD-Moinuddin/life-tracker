import type { Job } from "../../generated/prisma/client";
import { NotFoundError } from "../../lib/errors";
import * as repository from "./job.repository";
import type { CreateJobInput, UpdateJobInput } from "./job.schema";

export class JobNotFoundError extends NotFoundError {
  constructor() {
    super("Job not found");
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
  const job = await repository.updateJobForUser(id, userId, input);
  if (!job) {
    throw new JobNotFoundError();
  }
  return toJobResponse(job);
}

export async function deleteJob(userId: string, id: string) {
  const deleted = await repository.deleteJobForUser(id, userId);
  if (!deleted) {
    throw new JobNotFoundError();
  }
}

export async function assertJobOwned(userId: string, jobId: string) {
  const job = await repository.findJobByIdForUser(jobId, userId);
  if (!job) {
    throw new JobNotFoundError();
  }
}
