import { createHash, randomBytes } from "node:crypto";

// How long a reset link works. The frontend's confirmation text says
// "30 minutes": change both together.
export const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;

// A user who asked for a link less than this long ago gets no new one.
export const PASSWORD_RESET_COOLDOWN_MS = 60 * 1000;

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// The raw token only ever exists in the email link; only its hash is stored.
export function createResetToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashResetToken(token) };
}
