import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { listLeave } from "../lib/leave-api";
import type { Leave } from "../lib/leave-api";
import { useLeaveYear } from "./useLeave";

vi.mock("../lib/leave-api", () => ({ listLeave: vi.fn() }));

const christmas: Leave = {
  id: "leave-1",
  jobId: "job-1",
  job: { id: "job-1", name: "Cafe", hourlyRate: "14.00", type: "part_time" },
  type: "paid_vacation",
  startDate: "2026-12-21",
  endDate: "2026-12-23",
  weekdays: [1, 2, 3, 4, 5],
  minutesPerDay: 240,
  notes: null,
  createdAt: "2026-10-01T09:00:00.000Z",
  updatedAt: "2026-10-01T09:00:00.000Z",
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe("useLeaveYear", () => {
  it("loads the leave of the whole calendar year", async () => {
    vi.mocked(listLeave).mockResolvedValue([christmas]);

    const { result } = renderHook(() => useLeaveYear(2026));

    expect(result.current.state).toEqual({ status: "loading" });
    await waitFor(() =>
      expect(result.current.state).toEqual({
        status: "ready",
        data: [christmas],
      }),
    );
    expect(listLeave).toHaveBeenCalledTimes(1);
    expect(listLeave).toHaveBeenCalledWith({
      from: "2026-01-01",
      to: "2026-12-31",
    });
  });

  it("loads again when the year changes", async () => {
    vi.mocked(listLeave).mockResolvedValue([]);
    const { rerender } = renderHook(({ year }) => useLeaveYear(year), {
      initialProps: { year: 2026 },
    });
    await waitFor(() => expect(listLeave).toHaveBeenCalledTimes(1));

    rerender({ year: 2027 });

    await waitFor(() => expect(listLeave).toHaveBeenCalledTimes(2));
    expect(listLeave).toHaveBeenLastCalledWith({
      from: "2027-01-01",
      to: "2027-12-31",
    });
  });

  it("makes no request and is ready with no leave when it is not enabled", async () => {
    const { result } = renderHook(() => useLeaveYear(2026, false));

    expect(result.current.state).toEqual({ status: "ready", data: [] });
    await Promise.resolve();
    expect(listLeave).not.toHaveBeenCalled();
  });

  it("reports an error when the request fails, so callers can decide what to show", async () => {
    vi.mocked(listLeave).mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useLeaveYear(2026));

    await waitFor(() =>
      expect(result.current.state).toEqual({ status: "error" }),
    );
  });
});
