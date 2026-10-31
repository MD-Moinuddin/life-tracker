import type { Request, Response } from "express";
import { parseOrThrow, requireUserId } from "../../lib/http";
import {
  createLeaveSchema,
  listLeaveQuerySchema,
  updateLeaveSchema,
} from "./leave.schema";
import {
  createLeave,
  deleteLeave,
  listLeave,
  updateLeave,
} from "./leave.service";

export async function listLeaveHandler(req: Request, res: Response) {
  const query = parseOrThrow(listLeaveQuerySchema, req.query);
  res.status(200).json(await listLeave(requireUserId(req), query));
}

export async function createLeaveHandler(req: Request, res: Response) {
  const input = parseOrThrow(createLeaveSchema, req.body);
  const leave = await createLeave(requireUserId(req), input);
  res.status(201).json(leave);
}

export async function updateLeaveHandler(
  req: Request<{ id: string }>,
  res: Response,
) {
  const input = parseOrThrow(updateLeaveSchema, req.body);
  const leave = await updateLeave(requireUserId(req), req.params.id, input);
  res.status(200).json(leave);
}

export async function deleteLeaveHandler(
  req: Request<{ id: string }>,
  res: Response,
) {
  await deleteLeave(requireUserId(req), req.params.id);
  res.status(204).end();
}
