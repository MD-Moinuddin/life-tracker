import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "../../generated/prisma/client";
import { NotFoundError } from "../../lib/errors";
import { assertJobOwned } from "../jobs/job.service";
import * as repository from "./shift.repository";
import {
  InvalidShiftError,
  ShiftNotFoundError,
  createShift,
  deleteShift,
  listShifts,
  updateShift,
} from "./shift.service";

vi.mock("./shift.repository", () => ({
  findShiftByIdForUser: vi.fn(),
  listShiftsPageByUser: vi.fn(),
  createShift: vi.fn(),
  updateShiftForUser: vi.fn(),
  deleteShiftForUser: vi.fn(),
}));
vi.mock("../jobs/job.service", () => ({
  assertJobOwned: vi.fn(),
}));

const shiftRow = {
  id: "shift-1",
  jobId: "job-1",
  date: new Date("2026-10-03T00:00:00Z"),
  startTime: "22:00",
  endTime: "02:00",
  breakMinutes: 30,
  notes: null,
  createdAt: new Date("2026-10-01T09:00:00Z"),
  updatedAt: new Date("2026-10-01T09:00:00Z"),
  job: {
    id: "job-1",
    name: "Warehouse",
    hourlyRate: new Prisma.Decimal("13.5"),
    type: "part_time" as const,
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createShift", () => {
  it("checks the job belongs to the user, then creates the shift", async () => {
    vi.mocked(repository.createShift).mockResolvedValue(shiftRow);
    const input = {
      jobId: "job-1",
      date: "2026-10-03",
      startTime: "22:00",
      endTime: "02:00",
      breakMinutes: 30,
    };

    const result = await createShift("user-1", input);

    expect(assertJobOwned).toHaveBeenCalledWith("user-1", "job-1");
    expect(repository.createShift).toHaveBeenCalledWith(input);
    expect(result).toMatchObject({
      date: "2026-10-03",
      endDate: "2026-10-04",
      workedMinutes: 210,
      job: { name: "Warehouse", hourlyRate: "13.50" },
    });
  });

  it("does not create a shift under a job the user does not own", async () => {
    vi.mocked(assertJobOwned).mockRejectedValueOnce(
      new NotFoundError("Job not found"),
    );

    await expect(
      createShift("user-2", {
        jobId: "job-1",
        date: "2026-10-03",
        startTime: "09:00",
        endTime: "10:00",
        breakMinutes: 0,
      }),
    ).rejects.toThrow("Job not found");

    expect(repository.createShift).not.toHaveBeenCalled();
  });
});

describe("updateShift", () => {
  it("rejects a shift the user does not own", async () => {
    vi.mocked(repository.findShiftByIdForUser).mockResolvedValue(null);

    await expect(
      updateShift("user-2", "shift-1", { notes: "x" }),
    ).rejects.toThrow(ShiftNotFoundError);

    expect(repository.updateShiftForUser).not.toHaveBeenCalled();
  });

  it("checks the new job only when the job changes", async () => {
    vi.mocked(repository.findShiftByIdForUser).mockResolvedValue(shiftRow);
    vi.mocked(repository.updateShiftForUser).mockResolvedValue(shiftRow);

    await updateShift("user-1", "shift-1", { jobId: "job-1" });
    expect(assertJobOwned).not.toHaveBeenCalled();

    await updateShift("user-1", "shift-1", { jobId: "job-2" });
    expect(assertJobOwned).toHaveBeenCalledWith("user-1", "job-2");
  });

  it("rejects a break longer than the stored shift, on the break field", async () => {
    vi.mocked(repository.findShiftByIdForUser).mockResolvedValue(shiftRow);

    await expect(
      updateShift("user-1", "shift-1", { breakMinutes: 300 }),
    ).rejects.toThrow(InvalidShiftError);
    await expect(
      updateShift("user-1", "shift-1", { breakMinutes: 300 }),
    ).rejects.toMatchObject({
      statusCode: 400,
      fields: { breakMinutes: ["Break cannot be longer than the shift"] },
    });

    expect(repository.updateShiftForUser).not.toHaveBeenCalled();
  });

  it("rejects a start time equal to the stored end time", async () => {
    vi.mocked(repository.findShiftByIdForUser).mockResolvedValue(shiftRow);

    await expect(
      updateShift("user-1", "shift-1", { startTime: "02:00" }),
    ).rejects.toMatchObject({
      fields: { endTime: ["End time must be different from start time"] },
    });
  });

  it("treats a break of 0 as a real value, not a missing one", async () => {
    vi.mocked(repository.findShiftByIdForUser).mockResolvedValue(shiftRow);
    vi.mocked(repository.updateShiftForUser).mockResolvedValue(shiftRow);

    await updateShift("user-1", "shift-1", { breakMinutes: 0 });

    expect(repository.updateShiftForUser).toHaveBeenCalledWith(
      "shift-1",
      "user-1",
      { breakMinutes: 0 },
    );
  });

  it("reports not found when the shift disappears before the write", async () => {
    vi.mocked(repository.findShiftByIdForUser).mockResolvedValue(shiftRow);
    vi.mocked(repository.updateShiftForUser).mockResolvedValue(null);

    await expect(
      updateShift("user-1", "shift-1", { notes: "x" }),
    ).rejects.toThrow(ShiftNotFoundError);
  });
});

describe("deleteShift", () => {
  it("rejects a shift the user does not own", async () => {
    vi.mocked(repository.deleteShiftForUser).mockResolvedValue(false);

    await expect(deleteShift("user-2", "shift-1")).rejects.toThrow(
      ShiftNotFoundError,
    );
    expect(repository.deleteShiftForUser).toHaveBeenCalledWith(
      "shift-1",
      "user-2",
    );
  });

  it("deletes the user's own shift", async () => {
    vi.mocked(repository.deleteShiftForUser).mockResolvedValue(true);

    await expect(deleteShift("user-1", "shift-1")).resolves.toBeUndefined();
  });
});

describe("listShifts", () => {
  it("returns the page as an envelope with the total", async () => {
    vi.mocked(repository.listShiftsPageByUser).mockResolvedValue({
      items: [shiftRow],
      total: 7,
    });

    const result = await listShifts("user-1", {
      from: "2026-10-01",
      to: "2026-10-31",
      limit: 1,
      offset: 0,
    });

    expect(repository.listShiftsPageByUser).toHaveBeenCalledWith(
      "user-1",
      { from: "2026-10-01", to: "2026-10-31" },
      { limit: 1, offset: 0 },
    );
    expect(result).toMatchObject({ total: 7, limit: 1, offset: 0 });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({ workedMinutes: 210 });
  });
});
