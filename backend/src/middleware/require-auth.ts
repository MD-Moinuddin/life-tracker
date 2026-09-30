import type { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "../lib/errors";
import { verifyAccessToken } from "../lib/jwt";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(new UnauthorizedError());
    return;
  }

  try {
    req.userId = verifyAccessToken(header.slice("Bearer ".length)).sub;
  } catch {
    next(new UnauthorizedError());
    return;
  }

  next();
}
