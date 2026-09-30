import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiFetch } from "./api-client";

const fetchMock = vi.fn();

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status });
}

async function caughtError(run: () => Promise<unknown>) {
  try {
    await run();
  } catch (error) {
    return error;
  }
  return undefined;
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("fetch", fetchMock);
});

describe("apiFetch errors", () => {
  it("carries the server's message and field errors", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(400, {
        error: {
          message: "Validation failed",
          fields: { hourlyRate: ["Hourly rate must be greater than 0"] },
        },
      }),
    );

    const error = await caughtError(() => apiFetch("/api/jobs"));

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 400,
      message: "Validation failed",
      fields: { hourlyRate: ["Hourly rate must be greater than 0"] },
    });
  });

  it("uses empty field errors when the server sends none", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(404, { error: { message: "Job not found" } }),
    );

    const error = await caughtError(() => apiFetch("/api/jobs/x"));

    expect(error).toMatchObject({ status: 404, fields: {} });
  });

  it("falls back to a generic message when the body is not JSON", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("Bad gateway", { status: 502 }),
    );

    const error = await caughtError(() => apiFetch("/api/jobs"));

    expect(error).toMatchObject({
      status: 502,
      message: "Something went wrong",
      fields: {},
    });
  });
});
