import type { Request, Response } from "express";
import { parseOrThrow, requireUserId } from "../../lib/http";
import { createJobSchema, updateJobSchema } from "./job.schema";
import { createJob, deleteJob, listJobs, updateJob } from "./job.service";

export async function listJobsHandler(req: Request, res: Response) {
  res.status(200).json(await listJobs(requireUserId(req)));
}

export async function createJobHandler(req: Request, res: Response) {
  const input = parseOrThrow(createJobSchema, req.body);
  const job = await createJob(requireUserId(req), input);
  res.status(201).json(job);
}

export async function updateJobHandler(
  req: Request<{ id: string }>,
  res: Response,
) {
  const input = parseOrThrow(updateJobSchema, req.body);
  const job = await updateJob(requireUserId(req), req.params.id, input);
  res.status(200).json(job);
}

export async function deleteJobHandler(
  req: Request<{ id: string }>,
  res: Response,
) {
  await deleteJob(requireUserId(req), req.params.id);
  res.status(204).end();
}
