import { describe, expect, it } from "vitest";
import { createShiftSchema, updateShiftSchema } from "./shift.schema";

const validShift = {
  jobId: "job-1",
  date: "2026-10-03",
  startTime: "09:00",
  endTime: "17:00",
  breakMinutes: 30,
  notes: "Early start",
};

describe("createShiftSchema", () => {
  it("accepts a valid shift", () => {
    expect(createShiftSchema.safeParse(validShift).success).toBe(true);
  });

  it("defaults the break to 0 and leaves notes out", () => {
    const result = createShiftSchema.parse({
      jobId: "job-1",
      date: "2026-10-03",
      startTime: "09:00",
      endTime: "17:00",
    });

    expect(result.breakMinutes).toBe(0);
    expect(result.notes).toBeUndefined();
  });

  it("accepts a leap day", () => {
    expect(
      createShiftSchema.safeParse({ ...validShift, date: "2028-02-29" })
        .success,
    ).toBe(true);
  });

  it.each(["2026-02-30", "2026-13-01", "10/03/2026", "2026-1-5", ""])(
    "rejects the date %j",
    (date) => {
      expect(createShiftSchema.safeParse({ ...validShift, date }).success).toBe(
        false,
      );
    },
  );

  it.each(["24:00", "09:60", "9:00", "0900", "", "ab:cd"])(
    "rejects the start time %j",
    (startTime) => {
      expect(
        createShiftSchema.safeParse({ ...validShift, startTime }).success,
      ).toBe(false);
    },
  );

  it("rejects a bad end time", () => {
    expect(
      createShiftSchema.safeParse({ ...validShift, endTime: "25:00" }).success,
    ).toBe(false);
  });

  it.each([-1, 1.5, "30"])("rejects the break %j", (breakMinutes) => {
    expect(
      createShiftSchema.safeParse({ ...validShift, breakMinutes }).success,
    ).toBe(false);
  });

  it("rejects notes longer than 500 characters", () => {
    expect(
      createShiftSchema.safeParse({ ...validShift, notes: "a".repeat(501) })
        .success,
    ).toBe(false);
  });

  it("rejects a missing job", () => {
    expect(
      createShiftSchema.safeParse({ ...validShift, jobId: "" }).success,
    ).toBe(false);
  });
});

describe("updateShiftSchema", () => {
  it("accepts a single field", () => {
    expect(updateShiftSchema.safeParse({ startTime: "10:00" }).success).toBe(
      true,
    );
  });

  it("does not fill in a default break when it is left out", () => {
    const result = updateShiftSchema.parse({ startTime: "10:00" });

    expect(result).not.toHaveProperty("breakMinutes");
  });

  it("accepts null notes to clear them", () => {
    expect(updateShiftSchema.safeParse({ notes: null }).success).toBe(true);
  });

  it("rejects an empty update", () => {
    expect(updateShiftSchema.safeParse({}).success).toBe(false);
  });
});
