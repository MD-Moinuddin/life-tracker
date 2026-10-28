import { describe, expect, it } from "vitest";
import { passwordResetLimiter } from "../../middleware/rate-limit";
import { authRouter } from "./auth.routes";

interface RouteLayer {
  route?: {
    path: string;
    stack: { handle: unknown }[];
  };
}

function handlersFor(path: string): unknown[] {
  const layers = authRouter.stack as unknown as RouteLayer[];
  const layer = layers.find((candidate) => candidate.route?.path === path);
  return layer?.route?.stack.map((entry) => entry.handle) ?? [];
}

describe("auth routes", () => {
  it.each(["/forgot-password", "/reset-password"])(
    "rate limits %s with the password reset limiter",
    (path) => {
      expect(handlersFor(path)).toContain(passwordResetLimiter);
    },
  );
});
