import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { listLeave } from "../lib/leave-api";
import type { Leave } from "../lib/leave-api";
import type { Shift } from "../lib/shifts-api";
import { listShifts } from "../lib/shifts-api";
import { makeLeave, makeShift } from "../test/fixtures";
import type { LoadState } from "./useLoad";
import { useShiftLists } from "./useShiftLists";

vi.mock("../lib/shifts-api", () => ({ listShifts: vi.fn() }));
vi.mock("../lib/leave-api", () => ({ listLeave: vi.fn() }));
vi.mock("../lib/dates", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/dates")>()),
  localNow: () => "2026-10-07T12:00",
}));

function idsOf(state: LoadState<Shift[]>) {
  return state.status === "ready" ? state.data.map((shift) => shift.id) : [];
}

function leaveIdsOf(state: LoadState<Leave[]>) {
  return state.status === "ready" ? state.data.map((entry) => entry.id) : [];
}

const tracked = { id: "job-1", vacationHoursPerYear: "80.00" };
const untracked = { id: "job-2", vacationHoursPerYear: null };

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(listLeave).mockResolvedValue([]);
  vi.mocked(listShifts).mockResolvedValue({
    items: [],
    total: 0,
    limit: 500,
    offset: 0,
  });
});

describe("useShiftLists", () => {
  it("asks for the upcoming shifts and the current week, for one job", async () => {
    const { result } = renderHook(() => useShiftLists("job-1"));
    await waitFor(() => expect(result.current.history.status).toBe("ready"));

    expect(listShifts).toHaveBeenCalledWith({
      jobId: "job-1",
      from: "2026-10-06",
      limit: 500,
    });
    expect(listShifts).toHaveBeenCalledWith({
      jobId: "job-1",
      from: "2026-10-05",
      to: "2026-10-11",
      limit: 500,
    });
  });

  it("leaves the job out when none is given", async () => {
    const { result } = renderHook(() => useShiftLists());
    await waitFor(() => expect(result.current.history.status).toBe("ready"));

    expect(vi.mocked(listShifts).mock.calls[0]?.[0]?.jobId).toBeUndefined();
  });

  it("keeps shifts that have not ended upcoming and the rest in history", async () => {
    vi.mocked(listShifts).mockResolvedValue({
      items: [
        makeShift({ id: "ended", date: "2026-10-05" }),
        makeShift({ id: "future", date: "2026-10-09" }),
      ],
      total: 2,
      limit: 500,
      offset: 0,
    });

    const { result } = renderHook(() => useShiftLists());

    await waitFor(() => {
      expect(result.current.upcoming.status).toBe("ready");
      expect(result.current.history.status).toBe("ready");
    });
    expect(idsOf(result.current.upcoming)).toEqual(["future"]);
    expect(idsOf(result.current.history)).toEqual(["ended"]);
  });
});

describe("useShiftLists paid leave", () => {
  // Today is Wed 7 Oct 2026; the week is Mon 5 to Sun 11 Oct.
  const thisWeek = makeLeave({
    id: "this-week",
    startDate: "2026-10-05",
    endDate: "2026-10-09",
  });
  const later = makeLeave({
    id: "later",
    startDate: "2026-10-19",
    endDate: "2026-10-23",
  });

  it("asks for no leave at all when no job tracks vacation", async () => {
    const { result } = renderHook(() => useShiftLists(undefined, [untracked]));
    await waitFor(() => expect(result.current.history.status).toBe("ready"));

    expect(listLeave).not.toHaveBeenCalled();
    expect(result.current.upcomingLeave).toEqual({ status: "ready", data: [] });
    expect(result.current.historyLeave).toEqual({ status: "ready", data: [] });
  });

  it("asks for no leave while the jobs are not loaded", async () => {
    const { result } = renderHook(() => useShiftLists());
    await waitFor(() => expect(result.current.history.status).toBe("ready"));

    expect(listLeave).not.toHaveBeenCalled();
  });

  it("asks once for the leave from today and once for the week's", async () => {
    const { result } = renderHook(() =>
      useShiftLists(undefined, [tracked, untracked]),
    );
    await waitFor(() =>
      expect(result.current.historyLeave.status).toBe("ready"),
    );

    expect(listLeave).toHaveBeenCalledTimes(2);
    expect(listLeave).toHaveBeenCalledWith({ from: "2026-10-07" });
    expect(listLeave).toHaveBeenCalledWith({
      from: "2026-10-05",
      to: "2026-10-11",
    });
  });

  it("keeps upcoming the leave that ends today or later, and history the leave with counted days before today", async () => {
    vi.mocked(listLeave).mockImplementation(async (params) =>
      params?.to ? [thisWeek] : [thisWeek, later],
    );

    const { result } = renderHook(() => useShiftLists(undefined, [tracked]));
    await waitFor(() => {
      expect(leaveIdsOf(result.current.upcomingLeave)).toEqual([
        "this-week",
        "later",
      ]);
      expect(leaveIdsOf(result.current.historyLeave)).toEqual(["this-week"]);
    });
  });

  it("leaves out of history leave whose counted days in the week are all today or later", async () => {
    const fromToday = makeLeave({
      id: "from-today",
      startDate: "2026-10-07",
      endDate: "2026-10-09",
    });
    // Only Saturday and Sunday count, and both are still to come.
    const weekendOnly = makeLeave({
      id: "weekend",
      startDate: "2026-10-05",
      endDate: "2026-10-11",
      weekdays: [0, 6],
    });
    vi.mocked(listLeave).mockResolvedValue([fromToday, weekendOnly]);

    const { result } = renderHook(() => useShiftLists(undefined, [tracked]));
    await waitFor(() =>
      expect(result.current.historyLeave.status).toBe("ready"),
    );

    expect(leaveIdsOf(result.current.historyLeave)).toEqual([]);
  });

  it("never returns the leave of a job that stopped tracking vacation", async () => {
    vi.mocked(listLeave).mockResolvedValue([
      thisWeek,
      makeLeave({ id: "stopped", jobId: "job-2" }),
      makeLeave({
        id: "stopped-later",
        jobId: "job-2",
        startDate: "2026-10-19",
        endDate: "2026-10-23",
      }),
    ]);

    const { result } = renderHook(() =>
      useShiftLists(undefined, [tracked, untracked]),
    );
    await waitFor(() =>
      expect(leaveIdsOf(result.current.upcomingLeave)).toEqual(["this-week"]),
    );
    expect(leaveIdsOf(result.current.historyLeave)).toEqual(["this-week"]);
  });

  it("asks for one job's leave only, and only when that job tracks vacation", async () => {
    vi.mocked(listLeave).mockResolvedValue([
      thisWeek,
      makeLeave({ id: "other", jobId: "job-3", startDate: "2026-10-06" }),
    ]);
    const other = { id: "job-3", vacationHoursPerYear: "40.00" };

    const { result } = renderHook(() =>
      useShiftLists("job-1", [tracked, other]),
    );
    await waitFor(() =>
      expect(leaveIdsOf(result.current.upcomingLeave)).toEqual(["this-week"]),
    );
    expect(listLeave).toHaveBeenCalledWith({
      from: "2026-10-07",
      jobId: "job-1",
    });

    vi.mocked(listLeave).mockClear();
    const { result: untrackedJob } = renderHook(() =>
      useShiftLists("job-2", [tracked, untracked]),
    );
    await waitFor(() =>
      expect(untrackedJob.current.history.status).toBe("ready"),
    );
    expect(listLeave).not.toHaveBeenCalled();
  });

  it("treats a failed leave request as no leave, and still has the shifts", async () => {
    vi.mocked(listLeave).mockRejectedValue(new Error("down"));
    vi.mocked(listShifts).mockResolvedValue({
      items: [makeShift({ id: "future", date: "2026-10-09" })],
      total: 1,
      limit: 500,
      offset: 0,
    });

    const { result } = renderHook(() => useShiftLists(undefined, [tracked]));
    await waitFor(() =>
      expect(result.current.upcomingLeave).toEqual({
        status: "ready",
        data: [],
      }),
    );
    await waitFor(() =>
      expect(result.current.historyLeave).toEqual({
        status: "ready",
        data: [],
      }),
    );
    expect(idsOf(result.current.upcoming)).toEqual(["future"]);
  });

  it("asks for the leave of the week being viewed", async () => {
    const { result } = renderHook(() => useShiftLists(undefined, [tracked]));
    await waitFor(() =>
      expect(result.current.historyLeave.status).toBe("ready"),
    );

    act(() => result.current.previousWeek());

    await waitFor(() =>
      expect(listLeave).toHaveBeenCalledWith({
        from: "2026-09-28",
        to: "2026-10-04",
      }),
    );
  });

  it("asks for nothing new when re-rendered with a new but equal jobs list", async () => {
    const { result, rerender } = renderHook(
      ({ jobs }) => useShiftLists(undefined, jobs),
      { initialProps: { jobs: [{ ...tracked }, { ...untracked }] } },
    );
    await waitFor(() =>
      expect(result.current.historyLeave.status).toBe("ready"),
    );
    expect(listLeave).toHaveBeenCalledTimes(2);

    rerender({ jobs: [{ ...tracked }, { ...untracked }] });
    rerender({ jobs: [{ ...tracked }, { ...untracked }] });

    await waitFor(() =>
      expect(result.current.historyLeave.status).toBe("ready"),
    );
    expect(listLeave).toHaveBeenCalledTimes(2);
  });

  // By design: a period that contains today is both still to come (Upcoming)
  // and partly past (the current week's History).
  it("lists an ongoing period in both Upcoming and the current week's History", async () => {
    vi.mocked(listLeave).mockResolvedValue([thisWeek]);

    const { result } = renderHook(() => useShiftLists(undefined, [tracked]));

    await waitFor(() => {
      expect(leaveIdsOf(result.current.upcomingLeave)).toEqual(["this-week"]);
      expect(leaveIdsOf(result.current.historyLeave)).toEqual(["this-week"]);
    });
  });

  it("reloads only the shifts after a shift changes, never the leave", async () => {
    const { result } = renderHook(() => useShiftLists(undefined, [tracked]));
    await waitFor(() =>
      expect(result.current.historyLeave.status).toBe("ready"),
    );
    expect(listLeave).toHaveBeenCalledTimes(2);
    expect(listShifts).toHaveBeenCalledTimes(2);

    act(() => result.current.reloadShifts());

    await waitFor(() => expect(listShifts).toHaveBeenCalledTimes(4));
    expect(listLeave).toHaveBeenCalledTimes(2);
  });

  it("reloads only the leave on reloadLeave", async () => {
    const { result } = renderHook(() => useShiftLists(undefined, [tracked]));
    await waitFor(() =>
      expect(result.current.historyLeave.status).toBe("ready"),
    );
    expect(listLeave).toHaveBeenCalledTimes(2);

    act(() => result.current.reloadLeave());

    await waitFor(() => expect(listLeave).toHaveBeenCalledTimes(4));
    expect(listShifts).toHaveBeenCalledTimes(2);
  });
});
