import { Router } from "express";
import { signupHandler } from "./auth.controller";
import { authLimiter } from "../../middleware/rate-limit";

export const authRouter = Router();

authRouter.use(authLimiter);
authRouter.post("/signup", signupHandler);
