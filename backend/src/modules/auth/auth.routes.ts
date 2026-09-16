import { Router } from "express";
import {
  loginHandler,
  logoutHandler,
  refreshHandler,
  signupHandler,
} from "./auth.controller";
import { authLimiter } from "../../middleware/rate-limit";

export const authRouter = Router();

authRouter.use(authLimiter);
authRouter.post("/signup", signupHandler);
authRouter.post("/login", loginHandler);
authRouter.post("/refresh", refreshHandler);
authRouter.post("/logout", logoutHandler);
