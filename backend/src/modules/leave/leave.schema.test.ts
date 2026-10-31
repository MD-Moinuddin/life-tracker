import { describe, expect, it } from "vitest";
import {
  createLeaveSchema,
  listLeaveQuerySchema,
  updateLeaveSchema,
  validateLeaveDates,
} from "./leave.schema";

// Monday 9 March to Friday 13 March 2026.
const validLeave = {
  jobId: "job-1",
  startDate: "2026-03-09",
  endDate: "2026-03-13",
  weekdays: [1, 2, 3, 4, 5],
  minutesPerDay: 240,
};

function issues(input: object) {
  const result = createLeaveSchema.safeParse(input);
  return result.success
    ? []
    : result.error.issues.map((issue) => ({
        path: issue.path[0],
        message: issue.message,
      }));
}

describe("createLeaveSchema", () => {
  it("accepts a valid week", () => {
    expect(createLeaveSchema.parse(validLeave)).toEqual(validLeave);
  });

  it("rejects an end date before the start date", () => {
    expect(
      issues({ ...validLeave, startDate: "2026-03-13", endDate: "2026-03-09" }),
    ).toEqual([
      {
        path: "endDate",
        message: "End date must not be before the start date",
      },
    ]);
  });

  it("rejects a range across two calendar years", () => {
    expect(
      issues({ ...validLeave, startDate: "2026-12-28", endDate: "2027-01-02" }),
    ).toEqual([
      {
        path: "endDate",
        message:
          "Paid leave cannot span two calendar years. Add one entry for each year.",
      },
    ]);
  });

  it("rejects empty weekdays", () => {
    expect(issues({ ...validLeave, weekdays: [] })).toEqual([
      { path: "weekdays", message: "Pick at least one day of the week" },
    ]);
  });

  it("rejects missing weekdays", () => {
    expect(issues({ ...validLeave, weekdays: undefined })).toEqual([
      { path: "weekdays", message: "Pick at least one day of the week" },
    ]);
  });

  it("rejects a repeated weekday", () => {
    expect(issues({ ...validLeave, weekdays: [1, 1, 2] })).toEqual([
      { path: "weekdays", message: "Each day can only be picked once" },
    ]);
  });

  it.each([[[-1]], [[7]], [[1.5]]])("rejects the weekdays %j", (weekdays) => {
    expect(
      createLeaveSchema.safeParse({ ...validLeave, weekdays }).success,
    ).toBe(false);
  });

  it.each([15, 720])("accepts %j minutes per day", (minutesPerDay) => {
    expect(
      createLeaveSchema.safeParse({ ...validLeave, minutesPerDay }).success,
    ).toBe(true);
  });

  it.each([14, 721, 90.5, "240"])(
    "rejects %j minutes per day",
    (minutesPerDay) => {
      expect(issues({ ...validLeave, minutesPerDay })).toEqual([
        {
          path: "minutesPerDay",
          message: "Hours per day must be between 15 minutes and 12 hours",
        },
      ]);
    },
  );

  it("rejects a range with no counted day", () => {
    // Saturday 14 March only, with Monday to Friday counted.
    expect(
      issues({ ...validLeave, startDate: "2026-03-14", endDate: "2026-03-14" }),
    ).toEqual([
      {
        path: "weekdays",
        message: "None of the selected days fall between these dates",
      },
    ]);
  });

  it("rejects a date that is not real", () => {
    expect(
      createLeaveSchema.safeParse({ ...validLeave, startDate: "2026-02-30" })
        .success,
    ).toBe(false);
  });

  it.each([
    ["1", "1"],
    ["2026-1", "2026-1"],
    ["abc", "abd"],
    ["2026-02-30", "2026-03-02"],
  ])(
    "gives one date-format message and does not throw for the dates %s and %s",
    (startDate, endDate) => {
      const result = issues({ ...validLeave, startDate, endDate });

      expect(result.length).toBeGreaterThan(0);
      expect(result.map((issue) => issue.message)).not.toContain(
        "Paid leave cannot span two calendar years. Add one entry for each year.",
      );
      expect(result.map((issue) => issue.message)).not.toContain(
        "None of the selected days fall between these dates",
      );
    },
  );

  it.each([[[7]], [[-1]], [[1.5]], [[1, 8]]])(
    "gives the weekday message, on the weekdays field, for %j",
    (weekdays) => {
      expect(issues({ ...validLeave, weekdays })).toEqual([
        { path: "weekdays", message: "Pick at least one day of the week" },
      ]);
    },
  );

  it("rejects a date in year 0000 without throwing", () => {
    const result = issues({
      ...validLeave,
      startDate: "0000-01-01",
      endDate: "0000-01-05",
    });

    expect(result.map((issue) => issue.path)).toContain("startDate");
  });

  it("rejects a missing job", () => {
    expect(
      createLeaveSchema.safeParse({ ...validLeave, jobId: "" }).success,
    ).toBe(false);
  });

  it("trims notes and turns blank notes into null", () => {
    expect(
      createLeaveSchema.parse({ ...validLeave, notes: "  Summer trip  " })
        .notes,
    ).toBe("Summer trip");
    expect(createLeaveSchema.parse({ ...validLeave, notes: "   " }).notes).toBe(
      null,
    );
  });

  it("rejects notes longer than 500 characters", () => {
    expect(
      createLeaveSchema.safeParse({ ...validLeave, notes: "a".repeat(501) })
        .success,
    ).toBe(false);
  });

  it("accepts the option to remove overlapping shifts", () => {
    expect(
      createLeaveSchema.parse({ ...validLeave, removeOverlappingShifts: true })
        .removeOverlappingShifts,
    ).toBe(true);
  });
});

describe("updateLeaveSchema", () => {
  it("accepts a single field", () => {
    expect(updateLeaveSchema.parse({ minutesPerDay: 120 })).toEqual({
      minutesPerDay: 120,
    });
  });

  it("leaves out the option to remove shifts, which only applies on create", () => {
    expect(
      updateLeaveSchema.safeParse({ removeOverlappingShifts: true }).success,
    ).toBe(false);
    expect(
      updateLeaveSchema.parse({
        minutesPerDay: 120,
        removeOverlappingShifts: true,
      }),
    ).toEqual({ minutesPerDay: 120 });
  });

  it("clears the note when it is blank", () => {
    expect(updateLeaveSchema.parse({ notes: "" })).toEqual({ notes: null });
  });

  it("rejects an empty update", () => {
    expect(updateLeaveSchema.safeParse({}).success).toBe(false);
  });
});

describe("validateLeaveDates", () => {
  it("returns null for a valid range", () => {
    expect(validateLeaveDates(validLeave)).toBeNull();
  });

  it("names the field that is wrong", () => {
    expect(
      validateLeaveDates({ ...validLeave, endDate: "2026-03-01" })?.field,
    ).toBe("endDate");
    expect(validateLeaveDates({ ...validLeave, weekdays: [0, 6] })?.field).toBe(
      "weekdays",
    );
  });
});

describe("listLeaveQuerySchema", () => {
  it("accepts from, to and jobId", () => {
    expect(
      listLeaveQuerySchema.parse({
        from: "2026-03-01",
        to: "2026-03-31",
        jobId: "job-1",
      }),
    ).toEqual({ from: "2026-03-01", to: "2026-03-31", jobId: "job-1" });
    expect(listLeaveQuerySchema.parse({})).toEqual({});
  });

  it("accepts equal from and to dates", () => {
    expect(
      listLeaveQuerySchema.safeParse({ from: "2026-03-09", to: "2026-03-09" })
        .success,
    ).toBe(true);
  });

  it("rejects a from date after the to date, on the to field", () => {
    const result = listLeaveQuerySchema.safeParse({
      from: "2026-04-01",
      to: "2026-03-01",
    });

    expect(
      result.success ? [] : result.error.issues.map((issue) => issue.path[0]),
    ).toEqual(["to"]);
  });
});
