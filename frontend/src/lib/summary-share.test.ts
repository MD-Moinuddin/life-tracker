import { leave40h, noLeave } from "../test/fixtures";
import { describe, expect, it } from "vitest";
import type { SummaryJob } from "./summary-api";
import { earningsShares } from "./summary-share";

function job(earnedAmount: string): SummaryJob {
  return {
    jobId: earnedAmount,
    name: "Job",
    type: "part_time",
    hourlyRate: "12.00",
    earnedMinutes: 0,
    plannedMinutes: 0,
    earnedAmount,
    plannedAmount: "0.00",
    leave: noLeave,
  };
}

describe("earningsShares", () => {
  it("splits the earnings by job", () => {
    expect(earningsShares([job("84.00"), job("90.00")])).toEqual([48, 52]);
  });

  it("always adds up to 100, even when plain rounding would not", () => {
    const shares = earningsShares([job("1.00"), job("1.00"), job("1.00")]);

    expect(shares.reduce((sum, share) => sum + share, 0)).toBe(100);
    expect([...shares].sort()).toEqual([33, 33, 34]);
  });

  it("gives a job with no earnings 0 and the rest 100", () => {
    expect(earningsShares([job("0.00"), job("50.00")])).toEqual([0, 100]);
  });

  it("is all zeros when nothing was earned, and empty for no jobs", () => {
    expect(earningsShares([job("0.00"), job("0.00")])).toEqual([0, 0]);
    expect(earningsShares([])).toEqual([]);
  });

  it("counts earned paid leave as part of a job's earnings", () => {
    const withLeave = { ...job("504.00"), leave: leave40h };
    const shares = earningsShares([withLeave, job("1064.00")]);

    expect(shares).toEqual([50, 50]);
    expect(shares.reduce((sum, share) => sum + share, 0)).toBe(100);
  });
});
