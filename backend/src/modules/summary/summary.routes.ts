import { Router } from "express";
import { requireAuth } from "../../middleware/require-auth";
import { getSummaryHandler } from "./summary.controller";

export const summaryRouter = Router();

summaryRouter.use(requireAuth);

summaryRouter.get("/", getSummaryHandler);
