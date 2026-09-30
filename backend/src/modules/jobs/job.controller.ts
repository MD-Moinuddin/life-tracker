import type { NextFunction, Request, Response } from "express";
import type { ZodError } from "zod";
import { createJobSchema, updateJobSchema } from "./job.schema";
import {
  JobNotFoundError,
  createJob,
  deleteJob,
  listJobs,
  updateJob,
} from "./job.service";

function requireUserId(req: Request): string {
  if (!req.userId) {
    throw new Error("requireAuth must run before the job handlers");
  }
  return req.userId;
}

function sendValidationError(res: Response, error: ZodError) {
  res.status(400).json({
    error: {
      message: "Validation failed",
      fields: error.flatten().fieldErrors,
    },
  });
}

export async function listJobsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    res.status(200).json(await listJobs(requireUserId(req)));
  } catch (error) {
    next(error);
  }
}

export async function createJobHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const parsed = createJobSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  try {
    const job = await createJob(requireUserId(req), parsed.data);
    res.status(201).json(job);
  } catch (error) {
    next(error);
  }
}

export async function updateJobHandler(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  const parsed = updateJobSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  try {
    const job = await updateJob(requireUserId(req), req.params.id, parsed.data);
    res.status(200).json(job);
  } catch (error) {
    if (error instanceof JobNotFoundError) {
      res.status(404).json({ error: { message: error.message } });
      return;
    }
    next(error);
  }
}

export async function deleteJobHandler(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    await deleteJob(requireUserId(req), req.params.id);
    res.status(204).end();
  } catch (error) {
    if (error instanceof JobNotFoundError) {
      res.status(404).json({ error: { message: error.message } });
      return;
    }
    next(error);
  }
}
