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

interface TokenClaims {
  sub: string;
  iat: number;
}

function verifyToken(token: string, secret: string): TokenClaims {
  const payload = jwt.verify(token, secret, { algorithms: [ALGORITHM] });
  if (
    typeof payload === "string" ||
    typeof payload.sub !== "string" ||
    typeof payload.iat !== "number"
  ) {
    throw new jwt.JsonWebTokenError("Invalid token payload");
  }
  return { sub: payload.sub, iat: payload.iat };
}

export function signAccessToken(userId: string): string {
  return signToken(userId, env.JWT_ACCESS_SECRET, "15m");
}

export function signRefreshToken(userId: string): string {
  return signToken(userId, env.JWT_REFRESH_SECRET, "30d");
}

export function verifyAccessToken(token: string): { sub: string } {
  const { sub } = verifyToken(token, env.JWT_ACCESS_SECRET);
  return { sub };
}

export function verifyRefreshToken(token: string): TokenClaims {
  return verifyToken(token, env.JWT_REFRESH_SECRET);
}
