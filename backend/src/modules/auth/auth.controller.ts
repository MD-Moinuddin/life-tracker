import type { NextFunction, Request, Response } from "express";
import {
  EmailAlreadyRegisteredError,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
  login,
  refresh,
  signup,
} from "./auth.service";
import { loginSchema, signupSchema } from "./auth.schema";
import { env } from "../../config/env";

const REFRESH_TOKEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export async function signupHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: {
        message: "Validation failed",
        fields: parsed.error.flatten().fieldErrors,
      },
    });
    return;
  }

  try {
    const user = await signup(parsed.data);
    res.status(201).json(user);
  } catch (error) {
    if (error instanceof EmailAlreadyRegisteredError) {
      res.status(409).json({ error: { message: error.message } });
      return;
    }
    next(error);
  }
}

export async function loginHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: {
        message: "Validation failed",
        fields: parsed.error.flatten().fieldErrors,
      },
    });
    return;
  }

  try {
    const result = await login(parsed.data);
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: env.NODE_ENV === "production" ? "none" : "lax",
      path: "/api/auth",
      maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    });
    res
      .status(200)
      .json({ accessToken: result.accessToken, user: result.user });
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      res.status(401).json({ error: { message: error.message } });
      return;
    }
    next(error);
  }
}

export async function refreshHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = req.cookies.refreshToken as string | undefined;
  if (!token) {
    res.status(401).json({ error: { message: "Invalid refresh token" } });
    return;
  }

  try {
    const result = await refresh(token);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof InvalidRefreshTokenError) {
      res.status(401).json({ error: { message: error.message } });
      return;
    }
    next(error);
  }
}

export function logoutHandler(_req: Request, res: Response) {
  res.clearCookie("refreshToken", { path: "/api/auth" });
  res.status(204).end();
}
