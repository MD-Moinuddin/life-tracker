import type { NextFunction, Request, Response } from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NotFoundError, ValidationError } from "../lib/errors";
import { errorHandler } from "./error-handler";

function run(error: unknown) {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  } as unknown as Response;
  errorHandler(error, {} as Request, res, vi.fn() as unknown as NextFunction);
  return res;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("errorHandler", () => {
  it("sends an AppError with its status and message", () => {
    const res = run(new NotFoundError("Job not found"));

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: { message: "Job not found" },
    });
  });

  it("includes field errors for a validation error", () => {
    const res = run(new ValidationError({ name: ["Required"] }));

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: { message: "Validation failed", fields: { name: ["Required"] } },
    });
  });

  it("turns a malformed JSON body into a 400 without echoing the parser message", () => {
    const res = run({
      status: 400,
      expose: true,
      message: "Unexpected token }",
    });

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: { message: "Invalid request" },
    });
  });

  it("turns an oversized body into a 413", () => {
    const res = run({ status: 413, expose: true, message: "too large" });

    expect(res.status).toHaveBeenCalledWith(413);
    expect(res.json).toHaveBeenCalledWith({
      error: { message: "Request body too large" },
    });
  });

  it("hides the details of an unexpected error behind a 500", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = run(new Error("database password leaked"));

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: { message: "Something went wrong" },
    });
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
