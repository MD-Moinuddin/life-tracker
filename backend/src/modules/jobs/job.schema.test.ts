import { describe, expect, it } from "vitest";
import { createJobSchema, updateJobSchema } from "./job.schema";

const validJob = { name: "Warehouse", hourlyRate: "13.50", type: "part_time" };

describe("createJobSchema", () => {
  it("accepts a valid job and trims the name", () => {
    const result = createJobSchema.parse({ ...validJob, name: "  Cafe  " });

    expect(result.name).toBe("Cafe");
  });

  it("accepts a rate with one decimal or none", () => {
    expect(
      createJobSchema.safeParse({ ...validJob, hourlyRate: "13.5" }).success,
    ).toBe(true);
    expect(
      createJobSchema.safeParse({ ...validJob, hourlyRate: "13" }).success,
    ).toBe(true);
  });

  it.each(["0", "0.00", "-5", "12.345", "abc", "", "1000000"])(
    "rejects the hourly rate %j",
    (hourlyRate) => {
      expect(
        createJobSchema.safeParse({ ...validJob, hourlyRate }).success,
      ).toBe(false);
    },
  );

  it("rejects an empty name", () => {
    expect(
      createJobSchema.safeParse({ ...validJob, name: "   " }).success,
    ).toBe(false);
  });

  it("rejects an unknown job type", () => {
    expect(
      createJobSchema.safeParse({ ...validJob, type: "freelance" }).success,
    ).toBe(false);
  });
});

describe("updateJobSchema", () => {
  it("accepts a single field", () => {
    expect(updateJobSchema.safeParse({ hourlyRate: "15.00" }).success).toBe(
      true,
    );
  });

  it("rejects an empty update", () => {
    expect(updateJobSchema.safeParse({}).success).toBe(false);
  });
});
