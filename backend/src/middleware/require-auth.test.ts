import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { describe, expect, it, vi } from "vitest";
import { env } from "../config/env";
import { signAccessToken } from "../lib/jwt";
import { requireAuth } from "./require-auth";

function run(authorization?: string) {
  const req = { headers: { authorization } } as unknown as Request;
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  } as unknown as Response;
  const next = vi.fn() as unknown as NextFunction;
  requireAuth(req, res, next);
  return { req, res, next };
}

function expectRejected({ res, next }: ReturnType<typeof run>) {
  expect(res.status).toHaveBeenCalledWith(401);
  expect(res.json).toHaveBeenCalledWith({
    error: { message: "Unauthorized" },
  });
  expect(next).not.toHaveBeenCalled();
}

describe("requireAuth", () => {
  it("rejects a request with no Authorization header", () => {
    expectRejected(run(undefined));
  });

  it("rejects a header that is not a Bearer token", () => {
    expectRejected(run("Basic abc123"));
  });

  it("rejects a malformed token", () => {
    expectRejected(run("Bearer not-a-real-token"));
  });

  it("rejects an expired token", () => {
    const expired = jwt.sign({ sub: "user-1" }, env.JWT_ACCESS_SECRET, {
      expiresIn: -10,
    });
    expectRejected(run(`Bearer ${expired}`));
  });

  it("rejects a token signed with the refresh secret", () => {
    const wrongSecret = jwt.sign({ sub: "user-1" }, env.JWT_REFRESH_SECRET, {
      expiresIn: "15m",
    });
    expectRejected(run(`Bearer ${wrongSecret}`));
  });

  it("accepts a valid token and sets req.userId", () => {
    const { req, res, next } = run(`Bearer ${signAccessToken("user-1")}`);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.userId).toBe("user-1");
    expect(res.status).not.toHaveBeenCalled();
  });
});
