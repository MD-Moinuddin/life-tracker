import { beforeEach, describe, expect, it, vi } from "vitest";
import { authedFetch } from "./authed-api";
import { getSummary } from "./summary-api";
import { NO_SUMMARY_LEAVE } from "./summary-totals";

vi.mock("./authed-api", () => ({ authedFetch: vi.fn() }));

function calledUrl() {
  const [url = ""] = vi.mocked(authedFetch).mock.calls[0] ?? [];
  return url;
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(authedFetch).mockResolvedValue({
    from: "2026-10-05",
    to: "2026-10-11",
    jobs: [],
    totals: {
      earnedMinutes: 0,
      plannedMinutes: 0,
      earnedAmount: "0.00",
      plannedAmount: "0.00",
      leave: NO_SUMMARY_LEAVE,
    },
  });
});

describe("summary API client", () => {
  it("sends the range, the selected date and the current local time", async () => {
    await getSummary({
      range: "week",
      date: "2026-10-08",
      now: "2026-10-08T14:30",
    });

    const url = calledUrl();
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

    const url = calledUrl();
    const now = new URL(url, "http://localhost").searchParams.get("now");

    expect(now).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });

  it("fills in zero leave on every row and the totals when the response has none", async () => {
    // An older backend (during a release, say) sends no `leave`.
    vi.mocked(authedFetch).mockResolvedValue({
      from: "2026-10-05",
      to: "2026-10-11",
      jobs: [
        {
          jobId: "job-1",
          name: "Warehouse",
          type: "part_time",
          hourlyRate: "12.00",
          earnedMinutes: 480,
          plannedMinutes: 960,
          earnedAmount: "96.00",
          plannedAmount: "192.00",
        },
      ],
      totals: {
        earnedMinutes: 480,
        plannedMinutes: 960,
        earnedAmount: "96.00",
        plannedAmount: "192.00",
      },
    });

    const summary = await getSummary({ range: "week", date: "2026-10-08" });

    const zero = {
      earnedMinutes: 0,
      plannedMinutes: 0,
      earnedAmount: "0.00",
      plannedAmount: "0.00",
    };
    expect(NO_SUMMARY_LEAVE).toEqual(zero);
    expect(summary.jobs[0]?.leave).toEqual(zero);
    expect(summary.totals.leave).toEqual(zero);
    expect(summary.jobs[0]?.earnedAmount).toBe("96.00");
  });

  it("keeps the leave the response has", async () => {
    const leave = {
      earnedMinutes: 240,
      plannedMinutes: 480,
      earnedAmount: "56.00",
      plannedAmount: "112.00",
    };
    vi.mocked(authedFetch).mockResolvedValue({
      from: "2026-10-05",
      to: "2026-10-11",
      jobs: [],
      totals: {
        earnedMinutes: 0,
        plannedMinutes: 0,
        earnedAmount: "0.00",
        plannedAmount: "0.00",
        leave,
      },
    });

    const summary = await getSummary({ range: "week", date: "2026-10-08" });

    expect(summary.totals.leave).toEqual(leave);
  });
});
