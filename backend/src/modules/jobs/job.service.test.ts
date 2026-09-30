import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "../../generated/prisma/client";
import type { Job } from "../../generated/prisma/client";
import * as repository from "./job.repository";
import {
  JobNotFoundError,
  createJob,
  deleteJob,
  listJobs,
  updateJob,
} from "./job.service";

vi.mock("./job.repository", () => ({
  listJobsByUser: vi.fn(),
  findJobByIdForUser: vi.fn(),
  createJob: vi.fn(),
  updateJob: vi.fn(),
  deleteJob: vi.fn(),
}));

const ownJob: Job = {
  id: "job-1",
  userId: "user-1",
  name: "Warehouse",
  hourlyRate: new Prisma.Decimal("13.5"),
  type: "part_time",
  createdAt: new Date("2026-10-01T09:00:00Z"),
  updatedAt: new Date("2026-10-01T09:00:00Z"),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("updateJob", () => {
  it("rejects a job that belongs to another user", async () => {
    vi.mocked(repository.findJobByIdForUser).mockResolvedValue(null);

    await expect(
      updateJob("user-2", "job-1", { name: "Hacked" }),
    ).rejects.toThrow(JobNotFoundError);

    expect(repository.findJobByIdForUser).toHaveBeenCalledWith(
      "job-1",
      "user-2",
    );
    expect(repository.updateJob).not.toHaveBeenCalled();
  });

  it("updates the caller's own job and returns the rate as a string", async () => {
    vi.mocked(repository.findJobByIdForUser).mockResolvedValue(ownJob);
    vi.mocked(repository.updateJob).mockResolvedValue({
      ...ownJob,
      hourlyRate: new Prisma.Decimal("15"),
    });

    const result = await updateJob("user-1", "job-1", { hourlyRate: "15" });

    expect(repository.updateJob).toHaveBeenCalledWith("job-1", {
      hourlyRate: "15",
    });
    expect(result.hourlyRate).toBe("15.00");
    expect(result).not.toHaveProperty("userId");
  });
});

describe("deleteJob", () => {
  it("rejects a job that belongs to another user", async () => {
    vi.mocked(repository.findJobByIdForUser).mockResolvedValue(null);

    await expect(deleteJob("user-2", "job-1")).rejects.toThrow(
      JobNotFoundError,
    );

    expect(repository.deleteJob).not.toHaveBeenCalled();
  });

  it("deletes the caller's own job", async () => {
    vi.mocked(repository.findJobByIdForUser).mockResolvedValue(ownJob);

    await deleteJob("user-1", "job-1");

    expect(repository.deleteJob).toHaveBeenCalledWith("job-1");
  });
});

describe("createJob", () => {
  it("creates the job under the caller's user id", async () => {
    vi.mocked(repository.createJob).mockResolvedValue(ownJob);

    const result = await createJob("user-1", {
      name: "Warehouse",
      hourlyRate: "13.5",
      type: "part_time",
    });

    expect(repository.createJob).toHaveBeenCalledWith("user-1", {
      name: "Warehouse",
      hourlyRate: "13.5",
      type: "part_time",
    });
    expect(result.hourlyRate).toBe("13.50");
  });
});

describe("listJobs", () => {
  it("returns each job with its shift count and a string rate", async () => {
    vi.mocked(repository.listJobsByUser).mockResolvedValue([
      { ...ownJob, _count: { shifts: 3 } },
    ]);

    const result = await listJobs("user-1");

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "job-1",
      hourlyRate: "13.50",
      shiftCount: 3,
    });
    expect(result[0]).not.toHaveProperty("userId");
  });
});
