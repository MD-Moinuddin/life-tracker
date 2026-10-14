import { authedFetch } from "./authed-api";

export type JobType = "part_time" | "mini_job";

export interface Job {
  id: string;
  name: string;
  hourlyRate: string;
  type: JobType;
  createdAt: string;
  updatedAt: string;
}

export interface JobWithShiftCount extends Job {
  shiftCount: number;
}

export interface JobInput {
  name: string;
  hourlyRate: string;
  type: JobType;
}

export function listJobs() {
  return authedFetch<JobWithShiftCount[]>("/api/jobs");
}

export function createJob(input: JobInput) {
  return authedFetch<Job>("/api/jobs", { method: "POST", body: input });
}

export function updateJob(id: string, input: Partial<JobInput>) {
  return authedFetch<Job>(`/api/jobs/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: input,
  });
}

export function deleteJob(id: string) {
  return authedFetch<void>(`/api/jobs/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
