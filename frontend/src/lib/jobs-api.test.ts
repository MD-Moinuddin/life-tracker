import { beforeEach, describe, expect, it, vi } from "vitest";
import { authedFetch } from "./authed-api";
import { createJob, deleteJob, listJobs, updateJob } from "./jobs-api";

vi.mock("./authed-api", () => ({ authedFetch: vi.fn() }));

beforeEach(() => {
  vi.resetAllMocks();
});

describe("jobs API client", () => {
  it("lists jobs", async () => {
    await listJobs();

    expect(authedFetch).toHaveBeenCalledWith("/api/jobs");
  });

  it("creates a job with a POST body", async () => {
    const input = {
      name: "Cafe",
      hourlyRate: "10.5",
      type: "mini_job",
    } as const;

    await createJob(input);

    expect(authedFetch).toHaveBeenCalledWith("/api/jobs", {
      method: "POST",
      body: input,
    });
  });

  it("updates a job with a PATCH body", async () => {
    await updateJob("job-1", { hourlyRate: "12" });

    expect(authedFetch).toHaveBeenCalledWith("/api/jobs/job-1", {
      method: "PATCH",
      body: { hourlyRate: "12" },
    });
  });

  it("deletes a job and encodes the id in the path", async () => {
    await deleteJob("a/b");

    expect(authedFetch).toHaveBeenCalledWith("/api/jobs/a%2Fb", {
      method: "DELETE",
    });
  });
});
