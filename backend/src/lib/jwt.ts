import jwt from "jsonwebtoken";
import { env } from "../config/env";

const ALGORITHM = "HS256";

function signToken(
  userId: string,
  secret: string,
  expiresIn: jwt.SignOptions["expiresIn"],
): string {
  return jwt.sign({ sub: userId }, secret, {
    algorithm: ALGORITHM,
    expiresIn,
  });
}

function verifyToken(token: string, secret: string): { sub: string } {
  const payload = jwt.verify(token, secret, { algorithms: [ALGORITHM] });
  if (typeof payload === "string" || typeof payload.sub !== "string") {
    throw new jwt.JsonWebTokenError("Invalid token payload");
  }
  return { sub: payload.sub };
}

export function signAccessToken(userId: string): string {
  return signToken(userId, env.JWT_ACCESS_SECRET, "15m");
}

export function signRefreshToken(userId: string): string {
  return signToken(userId, env.JWT_REFRESH_SECRET, "30d");
}

export function verifyAccessToken(token: string): { sub: string } {
  return verifyToken(token, env.JWT_ACCESS_SECRET);
}

export function verifyRefreshToken(token: string): { sub: string } {
  return verifyToken(token, env.JWT_REFRESH_SECRET);
}
