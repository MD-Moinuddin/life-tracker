import { beforeEach, describe, expect, it, vi } from "vitest";
import { authedFetch } from "./authed-api";
import {
  createLeave,
  deleteLeave,
  listLeave,
  updateLeave,
  type LeaveInput,
} from "./leave-api";

vi.mock("./authed-api", () => ({ authedFetch: vi.fn() }));

beforeEach(() => {
  vi.resetAllMocks();
});

const input: LeaveInput = {
  jobId: "job-1",
  startDate: "2026-12-28",
  endDate: "2026-12-31",
  weekdays: [1, 2, 3, 4, 5],
  minutesPerDay: 240,
};

describe("leave API client", () => {
  it("lists leave without a query string when there are no filters", async () => {
    await listLeave();

    expect(authedFetch).toHaveBeenCalledWith("/api/leave");
  });

  it("puts the filters in the query string and skips the ones left out", async () => {
    await listLeave({ from: "2026-01-01", to: "2026-12-31", jobId: "job 1" });
    await listLeave({ from: "2026-01-01" });

    expect(authedFetch).toHaveBeenNthCalledWith(
      1,
      "/api/leave?from=2026-01-01&to=2026-12-31&jobId=job+1",
    );
    expect(authedFetch).toHaveBeenNthCalledWith(
      2,
      "/api/leave?from=2026-01-01",
    );
  });

  it("creates leave with a POST and the whole input", async () => {
    await createLeave({ ...input, removeOverlappingShifts: true });

    expect(authedFetch).toHaveBeenCalledWith("/api/leave", {
      method: "POST",
      body: { ...input, removeOverlappingShifts: true },
    });
  });

  it("updates leave with a PATCH of the changed fields", async () => {
    await updateLeave("leave/1", { minutesPerDay: 480 });

    expect(authedFetch).toHaveBeenCalledWith("/api/leave/leave%2F1", {
      method: "PATCH",
      body: { minutesPerDay: 480 },
    });
  });

  it("deletes leave with a DELETE", async () => {
    await deleteLeave("leave/1");

    expect(authedFetch).toHaveBeenCalledWith("/api/leave/leave%2F1", {
      method: "DELETE",
    });
  });
});
