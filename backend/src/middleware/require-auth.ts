import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../lib/jwt";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: { message: "Unauthorized" } });
    return;
  }

  try {
    const payload = verifyAccessToken(header.slice("Bearer ".length));
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: { message: "Unauthorized" } });
  }
}
