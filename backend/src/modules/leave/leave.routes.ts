import { Router } from "express";
import { requireAuth } from "../../middleware/require-auth";
import {
  createLeaveHandler,
  deleteLeaveHandler,
  listLeaveHandler,
  updateLeaveHandler,
} from "./leave.controller";

export const leaveRouter = Router();

leaveRouter.use(requireAuth);

leaveRouter.get("/", listLeaveHandler);
leaveRouter.post("/", createLeaveHandler);
leaveRouter.patch("/:id", updateLeaveHandler);
leaveRouter.delete("/:id", deleteLeaveHandler);
