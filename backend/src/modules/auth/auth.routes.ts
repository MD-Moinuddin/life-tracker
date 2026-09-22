import { Router } from "express";
import {
  loginHandler,
  logoutHandler,
  refreshHandler,
  signupHandler,
} from "./auth.controller";
import { authLimiter } from "../../middleware/rate-limit";

export const authRouter = Router();

authRouter.post("/signup", authLimiter, signupHandler);
authRouter.post("/login", authLimiter, loginHandler);
authRouter.post("/refresh", refreshHandler);
authRouter.post("/logout", logoutHandler);
