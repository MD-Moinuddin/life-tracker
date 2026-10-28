import { describe, expect, it } from "vitest";
import { jobPath, ROUTES } from "./routes";

describe("jobPath", () => {
  it("builds the detail URL of a job", () => {
    expect(jobPath("job-1")).toBe("/jobs/job-1");
  });

  it("encodes characters that would break the path", () => {
    expect(jobPath("a/b")).toBe("/jobs/a%2Fb");
  });

  it("matches the detail route pattern", () => {
    expect(ROUTES.jobDetail).toBe(`${ROUTES.jobs}/:id`);
  });
});

describe("password reset routes", () => {
  it("has the forgot and reset URLs the reset email links to", () => {
    expect(ROUTES.forgotPassword).toBe("/forgot-password");
    expect(ROUTES.resetPassword).toBe("/reset-password");
  });
});
