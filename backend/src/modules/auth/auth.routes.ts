import { Router } from "express";
import {
  forgotPasswordHandler,
  loginHandler,
  logoutHandler,
  refreshHandler,
  resetPasswordHandler,
  signupHandler,
} from "./auth.controller";
import { authLimiter, passwordResetLimiter } from "../../middleware/rate-limit";

export const authRouter = Router();

authRouter.post("/signup", authLimiter, signupHandler);
authRouter.post("/login", authLimiter, loginHandler);
authRouter.post("/refresh", refreshHandler);
authRouter.post("/logout", logoutHandler);
authRouter.post(
  "/forgot-password",
  passwordResetLimiter,
  forgotPasswordHandler,
);
authRouter.post("/reset-password", passwordResetLimiter, resetPasswordHandler);
