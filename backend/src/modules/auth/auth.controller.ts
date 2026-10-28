import type { Request, Response } from "express";
import { env } from "../../config/env";
import { parseOrThrow } from "../../lib/http";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
} from "./auth.schema";
import {
  InvalidRefreshTokenError,
  login,
  refresh,
  requestPasswordReset,
  resetPassword,
  signup,
} from "./auth.service";

const REFRESH_TOKEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const FORGOT_PASSWORD_MESSAGE =
  "If an account exists for that email, we've sent a link.";

export async function signupHandler(req: Request, res: Response) {
  const input = parseOrThrow(signupSchema, req.body);
  const user = await signup(input);
  res.status(201).json(user);
}

export async function loginHandler(req: Request, res: Response) {
  const input = parseOrThrow(loginSchema, req.body);
  const result = await login(input);
  res.cookie("refreshToken", result.refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    path: "/api/auth",
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
  });
  res.status(200).json({ accessToken: result.accessToken, user: result.user });
}

export async function refreshHandler(req: Request, res: Response) {
  const token = req.cookies.refreshToken as string | undefined;
  if (!token) {
    throw new InvalidRefreshTokenError();
  }

  const result = await refresh(token);
  res.status(200).json(result);
}

export function logoutHandler(_req: Request, res: Response) {
  res.clearCookie("refreshToken", { path: "/api/auth" });
  res.status(204).end();
}

export async function forgotPasswordHandler(req: Request, res: Response) {
  const { email } = parseOrThrow(forgotPasswordSchema, req.body);
  await requestPasswordReset(email);
  res.status(202).json({ message: FORGOT_PASSWORD_MESSAGE });
}

export async function resetPasswordHandler(req: Request, res: Response) {
  const input = parseOrThrow(resetPasswordSchema, req.body);
  await resetPassword(input);
  res.status(204).end();
}
