import { Router } from "express";
import { requireAuth } from "../../middleware/require-auth";
import {
  createJobHandler,
  deleteJobHandler,
  listJobsHandler,
  updateJobHandler,
} from "./job.controller";

export const jobRouter = Router();

jobRouter.use(requireAuth);

jobRouter.get("/", listJobsHandler);
jobRouter.post("/", createJobHandler);
jobRouter.patch("/:id", updateJobHandler);
jobRouter.delete("/:id", deleteJobHandler);
