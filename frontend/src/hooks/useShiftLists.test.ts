import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Shift } from "../lib/shifts-api";
import { listShifts } from "../lib/shifts-api";
import { makeShift } from "../test/fixtures";
import type { LoadState } from "./useLoad";
import { useShiftLists } from "./useShiftLists";

vi.mock("../lib/shifts-api", () => ({ listShifts: vi.fn() }));
vi.mock("../lib/dates", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/dates")>()),
  localNow: () => "2026-10-07T12:00",
}));

function idsOf(state: LoadState<Shift[]>) {
  return state.status === "ready" ? state.data.map((shift) => shift.id) : [];
}

beforeEach(() => {
  vi.resetAllMocks();
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
