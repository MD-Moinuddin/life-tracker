import { describe, expect, it } from "vitest";
import {
  AppError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "./errors";

describe("error classes", () => {
  it("carry the right status code and message", () => {
    expect(new ValidationError({ name: ["Required"] }).statusCode).toBe(400);
    expect(new UnauthorizedError().statusCode).toBe(401);
    expect(new NotFoundError("Job not found").message).toBe("Job not found");
    expect(new ConflictError().statusCode).toBe(409);
  });

  it("set name to the subclass name and stay instances of AppError", () => {
    const error = new NotFoundError();

    expect(error.name).toBe("NotFoundError");
    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(Error);
  });

  it("keep field errors on a validation error", () => {
    expect(new ValidationError({ name: ["Required"] }).fields).toEqual({
      name: ["Required"],
    });
  });
});
