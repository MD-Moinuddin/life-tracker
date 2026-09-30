import { describe, expect, it } from "vitest";
import {
  createShiftSchema,
  updateShiftSchema,
  validateShiftTimes,
} from "./shift.schema";

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

describe("cross-field rules on create", () => {
  function issuePaths(input: object) {
    const result = createShiftSchema.safeParse(input);
    return result.success ? [] : result.error.issues.map((i) => i.path[0]);
  }

  it("rejects equal start and end times on the end time", () => {
    expect(
      issuePaths({ ...validShift, startTime: "08:00", endTime: "08:00" }),
    ).toEqual(["endTime"]);
  });

  it("rejects a break longer than the shift on the break field", () => {
    expect(
      issuePaths({
        ...validShift,
        startTime: "09:00",
        endTime: "10:00",
        breakMinutes: 61,
      }),
    ).toEqual(["breakMinutes"]);
  });

  it("accepts a break equal to the whole shift", () => {
    expect(
      createShiftSchema.safeParse({
        ...validShift,
        startTime: "09:00",
        endTime: "10:00",
        breakMinutes: 60,
      }).success,
    ).toBe(true);
  });

  it("measures the break against an overnight shift", () => {
    const overnight = { ...validShift, startTime: "22:00", endTime: "02:00" };

    expect(
      createShiftSchema.safeParse({ ...overnight, breakMinutes: 240 }).success,
    ).toBe(true);
    expect(
      createShiftSchema.safeParse({ ...overnight, breakMinutes: 241 }).success,
    ).toBe(false);
  });
});

describe("validateShiftTimes", () => {
  it("returns null for a valid shift", () => {
    expect(
      validateShiftTimes({
        startTime: "09:00",
        endTime: "17:00",
        breakMinutes: 30,
      }),
    ).toBeNull();
  });

  it("names the field that is wrong", () => {
    expect(
      validateShiftTimes({
        startTime: "08:00",
        endTime: "08:00",
        breakMinutes: 0,
      })?.field,
    ).toBe("endTime");
    expect(
      validateShiftTimes({
        startTime: "09:00",
        endTime: "10:00",
        breakMinutes: 90,
      })?.field,
    ).toBe("breakMinutes");
  });
});

describe("blank notes", () => {
  it("turns empty and whitespace-only notes into null on create", () => {
    expect(createShiftSchema.parse({ ...validShift, notes: "" }).notes).toBe(
      null,
    );
    expect(createShiftSchema.parse({ ...validShift, notes: "   " }).notes).toBe(
      null,
    );
  });

  it("keeps real notes, trimmed", () => {
    expect(
      createShiftSchema.parse({ ...validShift, notes: "  Early start  " })
        .notes,
    ).toBe("Early start");
  });

  it("clears the note on update when it is blank", () => {
    expect(updateShiftSchema.parse({ notes: "" })).toEqual({ notes: null });
  });

  it("still rejects notes over 500 characters after trimming", () => {
    expect(
      createShiftSchema.safeParse({ ...validShift, notes: "a".repeat(501) })
        .success,
    ).toBe(false);
  });
});
