import type { Request, Response } from "express";
import { parseOrThrow, requireUserId } from "../../lib/http";
import { summaryQuerySchema } from "./summary.schema";
import { getSummary } from "./summary.service";

export async function getSummaryHandler(req: Request, res: Response) {
  const query = parseOrThrow(summaryQuerySchema, req.query);
  res.status(200).json(await getSummary(requireUserId(req), query));
}
