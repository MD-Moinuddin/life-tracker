import { describe, expect, it } from "vitest";
import { ApiError } from "./api-client";
import { toErrorMessage, toFormErrors } from "./form-errors";

describe("toFormErrors", () => {
  it("keeps the server's field errors", () => {
    const error = new ApiError(400, "Validation failed", {
      hourlyRate: ["Hourly rate must be greater than 0"],
    });

    expect(toFormErrors(error)).toEqual({
      hourlyRate: ["Hourly rate must be greater than 0"],
    });
  });

  it("puts a server error without fields under form", () => {
    expect(toFormErrors(new ApiError(404, "Job not found"))).toEqual({
      form: ["Job not found"],
    });
  });

  it("uses a generic message for unexpected errors", () => {
    expect(toFormErrors(new Error("network down"))).toEqual({
      form: ["Something went wrong. Please try again."],
    });
  });
});

describe("toErrorMessage", () => {
  it("returns the server's message", () => {
    expect(toErrorMessage(new ApiError(404, "Job not found"))).toBe(
      "Job not found",
    );
  });

  it("hides the details of unexpected errors", () => {
    expect(toErrorMessage(new Error("database password"))).toBe(
      "Something went wrong. Please try again.",
    );
    expect(toErrorMessage("oops")).toBe(
      "Something went wrong. Please try again.",
    );
  });
});
