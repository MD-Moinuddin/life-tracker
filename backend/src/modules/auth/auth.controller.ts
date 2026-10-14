import type { Request, Response } from "express";
import { env } from "../../config/env";
import { parseOrThrow } from "../../lib/http";
import { loginSchema, signupSchema } from "./auth.schema";
import {
  InvalidRefreshTokenError,
  login,
  refresh,
  signup,
} from "./auth.service";

const REFRESH_TOKEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

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
