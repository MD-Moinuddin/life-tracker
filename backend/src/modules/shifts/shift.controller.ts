import type { Request, Response } from "express";
import { parseOrThrow, requireUserId } from "../../lib/http";
import {
  createShiftSchema,
  listShiftsQuerySchema,
  updateShiftSchema,
} from "./shift.schema";
import {
  createShift,
  deleteShift,
  listShifts,
  updateShift,
} from "./shift.service";

export async function listShiftsHandler(req: Request, res: Response) {
  const query = parseOrThrow(listShiftsQuerySchema, req.query);
  res.status(200).json(await listShifts(requireUserId(req), query));
}

export async function createShiftHandler(req: Request, res: Response) {
  const input = parseOrThrow(createShiftSchema, req.body);
  const shift = await createShift(requireUserId(req), input);
  res.status(201).json(shift);
}

export async function updateShiftHandler(
  req: Request<{ id: string }>,
  res: Response,
) {
  const input = parseOrThrow(updateShiftSchema, req.body);
  const shift = await updateShift(requireUserId(req), req.params.id, input);
  res.status(200).json(shift);
}

export async function deleteShiftHandler(
  req: Request<{ id: string }>,
  res: Response,
) {
  await deleteShift(requireUserId(req), req.params.id);
  res.status(204).end();
}
