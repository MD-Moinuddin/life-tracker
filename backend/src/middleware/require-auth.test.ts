import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { describe, expect, it, vi } from "vitest";
import { env } from "../config/env";
import { UnauthorizedError } from "../lib/errors";
import { signAccessToken } from "../lib/jwt";
import { requireAuth } from "./require-auth";

function run(authorization?: string, next = vi.fn()) {
  const req = { headers: { authorization } } as unknown as Request;
  requireAuth(req, {} as Response, next as unknown as NextFunction);
  return { req, next };
}

function expectRejected({ next }: ReturnType<typeof run>) {
  expect(next).toHaveBeenCalledTimes(1);
  expect(next.mock.calls[0]?.[0]).toBeInstanceOf(UnauthorizedError);
  expect(next.mock.calls[0]?.[0]).toMatchObject({
    statusCode: 401,
    message: "Unauthorized",
  });
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
    const { req, next } = run(`Bearer ${signAccessToken("user-1")}`);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
    expect(req.userId).toBe("user-1");
  });

  it("does not turn an error from the next handler into a 401", () => {
    const next = vi.fn(() => {
      throw new Error("downstream failure");
    });

    expect(() => run(`Bearer ${signAccessToken("user-1")}`, next)).toThrow(
      "downstream failure",
    );
    expect(next).toHaveBeenCalledTimes(1);
  });
});
