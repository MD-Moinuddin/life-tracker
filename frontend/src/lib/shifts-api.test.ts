import { beforeEach, describe, expect, it, vi } from "vitest";
import { authedFetch } from "./authed-api";
import {
  createShift,
  deleteShift,
  listShifts,
  updateShift,
} from "./shifts-api";

vi.mock("./authed-api", () => ({ authedFetch: vi.fn() }));

beforeEach(() => {
  vi.resetAllMocks();
});

describe("shifts API client", () => {
  it("lists shifts without a query string when there are no filters", async () => {
    await listShifts();

    expect(authedFetch).toHaveBeenCalledWith("/api/shifts");
  });

  it("puts the filters in the query string and skips the ones left out", async () => {
    await listShifts({ from: "2026-10-05", to: "2026-10-11", limit: 500 });

    expect(authedFetch).toHaveBeenCalledWith(
      "/api/shifts?from=2026-10-05&to=2026-10-11&limit=500",
    );
  });

  it("creates a shift with a POST body", async () => {
    const input = {
      jobId: "job-1",
      date: "2026-10-03",
      startTime: "22:00",
      endTime: "02:00",
      breakMinutes: 30,
    };

    await createShift(input);

    expect(authedFetch).toHaveBeenCalledWith("/api/shifts", {
      method: "POST",
      body: input,
    });
  });

  it("updates a shift with a PATCH body", async () => {
    await updateShift("shift-1", { notes: null });

    expect(authedFetch).toHaveBeenCalledWith("/api/shifts/shift-1", {
      method: "PATCH",
      body: { notes: null },
    });
  });

  it("deletes a shift and encodes the id in the path", async () => {
    await deleteShift("a/b");

    expect(authedFetch).toHaveBeenCalledWith("/api/shifts/a%2Fb", {
      method: "DELETE",
    });
  });
});
