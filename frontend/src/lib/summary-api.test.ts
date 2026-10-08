import { beforeEach, describe, expect, it, vi } from "vitest";
import { authedFetch } from "./authed-api";
import { getSummary } from "./summary-api";

vi.mock("./authed-api", () => ({ authedFetch: vi.fn() }));

beforeEach(() => {
  vi.resetAllMocks();
});

describe("summary API client", () => {
  it("sends the range, the selected date and the current local time", async () => {
    await getSummary({
      range: "week",
      date: "2026-10-08",
      now: "2026-10-08T14:30",
    });

    const url = vi.mocked(authedFetch).mock.calls[0][0];
    const params = new URL(url, "http://localhost").searchParams;

    expect(url.startsWith("/api/summary?")).toBe(true);
    expect(Object.fromEntries(params)).toEqual({
      range: "week",
      date: "2026-10-08",
      now: "2026-10-08T14:30",
    });
  });

  it("uses the browser's local time when now is left out", async () => {
    await getSummary({ range: "month", date: "2026-10-08" });

    const url = vi.mocked(authedFetch).mock.calls[0][0];
    const now = new URL(url, "http://localhost").searchParams.get("now");

    expect(now).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });
});
