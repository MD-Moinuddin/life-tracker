import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "./api-client";
import { refresh } from "./auth-api";
import { authedFetch } from "./authed-api";
import { useAuthStore } from "../store/auth-store";
import { buildDemoData } from "./demo/demo-data";
import { loadDemoDb } from "./demo/demo-db";

vi.mock("./auth-api", () => ({ refresh: vi.fn() }));

const user = {
  id: "user-1",
  name: "Alex",
  email: "a@b.com",
  createdAt: "2026-10-01T00:00:00.000Z",
};

const fetchMock = vi.fn();

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status });
}

function unauthorized() {
  return jsonResponse(401, { error: { message: "Unauthorized" } });
}

function authorizationOf(call: number) {
  const init = fetchMock.mock.calls[call]?.[1] as RequestInit;
  return (init.headers as Record<string, string>).Authorization;
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("fetch", fetchMock);
  useAuthStore.setState({
    user,
    accessToken: "old-token",
    isInitialized: true,
  });
});

describe("authedFetch", () => {
  it("sends the stored access token", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { ok: true }));

    const result = await authedFetch("/api/jobs");

    expect(result).toEqual({ ok: true });
    expect(authorizationOf(0)).toBe("Bearer old-token");
  });

  it("refreshes once after a 401, stores the new token and retries", async () => {
    fetchMock
      .mockResolvedValueOnce(unauthorized())
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    vi.mocked(refresh).mockResolvedValue({ user, accessToken: "new-token" });

    const result = await authedFetch("/api/jobs");

    expect(result).toEqual({ ok: true });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(authorizationOf(1)).toBe("Bearer new-token");
    expect(useAuthStore.getState().accessToken).toBe("new-token");
  });

  it("shares one refresh between simultaneous 401s", async () => {
    fetchMock.mockImplementation((_url: string, init: RequestInit) =>
      Promise.resolve(
        (init.headers as Record<string, string>).Authorization ===
          "Bearer new-token"
          ? jsonResponse(200, { ok: true })
          : unauthorized(),
      ),
    );
    vi.mocked(refresh).mockResolvedValue({ user, accessToken: "new-token" });

    const results = await Promise.all([
      authedFetch("/api/jobs"),
      authedFetch("/api/shifts"),
    ]);

    expect(results).toEqual([{ ok: true }, { ok: true }]);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("clears the session and rethrows the 401 when the refresh fails", async () => {
    fetchMock.mockResolvedValueOnce(unauthorized());
    vi.mocked(refresh).mockRejectedValue(
      new ApiError(401, "Invalid refresh token"),
    );

    await expect(authedFetch("/api/jobs")).rejects.toMatchObject({
      status: 401,
      message: "Unauthorized",
    });

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it("does not refresh for errors other than 401", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(500, { error: { message: "Something went wrong" } }),
    );

    await expect(authedFetch("/api/jobs")).rejects.toMatchObject({
      status: 500,
    });

    expect(refresh).not.toHaveBeenCalled();
  });

  it("retries only once when the new token is also rejected", async () => {
    fetchMock.mockImplementation(() => Promise.resolve(unauthorized()));
    vi.mocked(refresh).mockResolvedValue({ user, accessToken: "new-token" });

    await expect(authedFetch("/api/jobs")).rejects.toMatchObject({
      status: 401,
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  describe("in the demo", () => {
    beforeEach(() => {
      loadDemoDb(buildDemoData("2026-10-30"));
      useAuthStore.setState({
        user: { ...user, isDemo: true },
        accessToken: "demo",
      });
    });

    it("answers from the demo data and never uses the network", async () => {
      const jobs = await authedFetch<{ name: string }[]>("/api/jobs");

      expect(jobs.map((job) => job.name)).toContain("Cafe");
      expect(fetchMock).not.toHaveBeenCalled();
      expect(refresh).not.toHaveBeenCalled();
    });

    it("passes the method and the body on to the demo", async () => {
      await authedFetch("/api/jobs", {
        method: "POST",
        body: { name: "Kiosk", hourlyRate: "11.00", type: "part_time" },
      });
      const jobs = await authedFetch<{ name: string }[]>("/api/jobs");

      expect(jobs.map((job) => job.name)).toContain("Kiosk");
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});
