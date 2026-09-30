import { describe, expect, it } from "vitest";
import { summaryQuerySchema } from "./summary.schema";

const validQuery = {
  range: "month",
  date: "2026-10-15",
  now: "2026-10-03T14:30",
};

describe("summaryQuerySchema", () => {
  it("accepts a valid week and a valid month query", () => {
    expect(summaryQuerySchema.parse(validQuery)).toEqual(validQuery);
    expect(
      summaryQuerySchema.safeParse({ ...validQuery, range: "week" }).success,
    ).toBe(true);
  });

  it.each([
    ["range", { range: "year" }],
    ["range", { range: undefined }],
    ["date", { date: "2026-02-30" }],
    ["date", { date: "10/15/2026" }],
    ["date", { date: undefined }],
    ["now", { now: "2026-10-03" }],
    ["now", { now: "2026-10-03T14:30:00" }],
    ["now", { now: "2026-10-03T14:30Z" }],
    ["now", { now: "2026-10-03T25:00" }],
    ["now", { now: "2026-02-30T10:00" }],
    ["now", { now: undefined }],
  ])("rejects a bad %s", (field, override) => {
    const result = summaryQuerySchema.safeParse({ ...validQuery, ...override });

    expect(result.success).toBe(false);
    expect(
      result.success ? [] : result.error.issues.map((issue) => issue.path[0]),
    ).toEqual([field]);
  });
});
