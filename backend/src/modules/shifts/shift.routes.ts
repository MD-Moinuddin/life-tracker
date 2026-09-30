import { Router } from "express";
import { requireAuth } from "../../middleware/require-auth";
import {
  createShiftHandler,
  deleteShiftHandler,
  listShiftsHandler,
  updateShiftHandler,
} from "./shift.controller";

export const shiftRouter = Router();

shiftRouter.use(requireAuth);

shiftRouter.get("/", listShiftsHandler);
shiftRouter.post("/", createShiftHandler);
shiftRouter.patch("/:id", updateShiftHandler);
shiftRouter.delete("/:id", deleteShiftHandler);
