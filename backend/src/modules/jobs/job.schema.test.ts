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

describe("vacation fields", () => {
  const base = { name: "Cafe", hourlyRate: "14", type: "part_time" as const };

  it("accepts a yearly allowance with up to 2 decimals", () => {
    expect(
      createJobSchema.parse({ ...base, vacationHoursPerYear: "80" })
        .vacationHoursPerYear,
    ).toBe("80");
    expect(
      createJobSchema.safeParse({ ...base, vacationHoursPerYear: "80.5" })
        .success,
    ).toBe(true);
  });

  it("accepts null, meaning not tracked", () => {
    expect(
      createJobSchema.safeParse({ ...base, vacationHoursPerYear: null })
        .success,
    ).toBe(true);
  });

  it.each(["0", "-1", "abc", "1000.01", "80.123"])(
    "rejects an allowance of %s",
    (value) => {
      expect(
        createJobSchema.safeParse({ ...base, vacationHoursPerYear: value })
          .success,
      ).toBe(false);
    },
  );

  it("needs a carry-over year when carry-over hours are above 0", () => {
    const result = createJobSchema.safeParse({
      ...base,
      vacationHoursPerYear: "80",
      vacationCarryOverHours: "8",
    });
    expect(result.success).toBe(false);
    expect(
      createJobSchema.safeParse({
        ...base,
        vacationHoursPerYear: "80",
        vacationCarryOverHours: "8",
        vacationCarryOverYear: 2026,
      }).success,
    ).toBe(true);
    expect(
      createJobSchema.safeParse({ ...base, vacationCarryOverHours: "0" })
        .success,
    ).toBe(true);
  });

  it("applies the same rules to an update", () => {
    expect(
      updateJobSchema.safeParse({ vacationHoursPerYear: "88" }).success,
    ).toBe(true);
    expect(
      updateJobSchema.safeParse({ vacationCarryOverHours: "5" }).success,
    ).toBe(false);
  });

  it.each(["0.01", "1000", "1000.00"])(
    "accepts an allowance of %s, the edges of the range",
    (value) => {
      expect(
        createJobSchema.safeParse({ ...base, vacationHoursPerYear: value })
          .success,
      ).toBe(true);
    },
  );

  it.each(["-1", "1000.01", "abc"])(
    "rejects carry-over hours of %s",
    (value) => {
      expect(
        createJobSchema.safeParse({
          ...base,
          vacationCarryOverHours: value,
          vacationCarryOverYear: 2026,
        }).success,
      ).toBe(false);
    },
  );

  it.each([1999, 2101, 2026.5])("rejects a carry-over year of %s", (year) => {
    expect(
      createJobSchema.safeParse({
        ...base,
        vacationCarryOverHours: "8",
        vacationCarryOverYear: year,
      }).success,
    ).toBe(false);
  });
});
