import { describe, expect, it } from "vitest";
import { ApiError } from "../api-client";
import { parseJobBody, parseShiftBody } from "./demo-validation";

function fieldsOf(run: () => unknown) {
  try {
    run();
  } catch (error) {
    if (error instanceof ApiError) {
      return { status: error.status, fields: error.fields };
    }
    throw error;
  }
  return null;
}

describe("parseJobBody", () => {
  it("accepts a job and tidies the name and the rate", () => {
    expect(
      parseJobBody(
        { name: "  Cafe ", hourlyRate: "12.5", type: "mini_job" },
        false,
      ),
    ).toEqual({ name: "Cafe", hourlyRate: "12.50", type: "mini_job" });
  });

  it("refuses a missing name, a bad rate and an unknown type, with the backend's messages", () => {
    expect(
      fieldsOf(() =>
        parseJobBody({ name: " ", hourlyRate: "abc", type: "x" }, false),
      ),
    ).toEqual({
      status: 400,
      fields: {
        name: ["Name is required"],
        hourlyRate: ["Hourly rate must be a number with at most 2 decimals"],
        type: ["Type must be part_time or mini_job"],
      },
    });
  });

  it("refuses a rate of zero", () => {
    expect(
      fieldsOf(() =>
        parseJobBody({ name: "A", hourlyRate: "0", type: "part_time" }, false),
      )?.fields.hourlyRate,
    ).toEqual(["Hourly rate must be greater than 0"]);
  });

  it("only checks the fields it is sent for an update", () => {
    expect(parseJobBody({ hourlyRate: "9.00" }, true)).toEqual({
      hourlyRate: "9.00",
    });
  });

  it("refuses an update with nothing in it", () => {
    expect(fieldsOf(() => parseJobBody({}, true))?.status).toBe(400);
  });
});

const goodShift = {
  jobId: "job-1",
  date: "2026-10-03",
  startTime: "09:00",
  endTime: "17:00",
  breakMinutes: 30,
};

describe("parseShiftBody", () => {
  it("accepts a shift, with the break defaulting to none and empty notes to null", () => {
    const withoutBreak = {
      jobId: goodShift.jobId,
      date: goodShift.date,
      startTime: goodShift.startTime,
      endTime: goodShift.endTime,
    };

    expect(parseShiftBody({ ...withoutBreak, notes: "  " }, false)).toEqual({
      ...withoutBreak,
      breakMinutes: 0,
      notes: null,
    });
  });

  it("refuses bad dates and times with the backend's messages", () => {
    expect(
      fieldsOf(() =>
        parseShiftBody(
          {
            ...goodShift,
            date: "2026-02-30",
            startTime: "9:00",
            endTime: "25:00",
          },
          false,
        ),
      )?.fields,
    ).toEqual({
      date: ["Date must be a real date in YYYY-MM-DD format"],
      startTime: ["Time must be in HH:mm format"],
      endTime: ["Time must be in HH:mm format"],
    });
  });

  it("refuses equal start and end times", () => {
    expect(
      fieldsOf(() => parseShiftBody({ ...goodShift, endTime: "09:00" }, false))
        ?.fields.endTime,
    ).toEqual(["End time must be different from start time"]);
  });

  it("refuses a break longer than the shift, counting an overnight shift's full length", () => {
    const overnight = { ...goodShift, startTime: "22:00", endTime: "02:00" };

    expect(
      fieldsOf(() => parseShiftBody({ ...overnight, breakMinutes: 241 }, false))
        ?.fields.breakMinutes,
    ).toEqual(["Break cannot be longer than the shift"]);
    expect(
      parseShiftBody({ ...overnight, breakMinutes: 240 }, false),
    ).toBeDefined();
  });

  it("refuses a negative or fractional break", () => {
    expect(
      fieldsOf(() => parseShiftBody({ ...goodShift, breakMinutes: -1 }, false))
        ?.fields.breakMinutes,
    ).toEqual(["Break cannot be negative"]);
    expect(
      fieldsOf(() => parseShiftBody({ ...goodShift, breakMinutes: 1.5 }, false))
        ?.fields.breakMinutes,
    ).toEqual(["Break must be a whole number of minutes"]);
  });

  it("checks an updated time against the shift's other times", () => {
    const current = { ...goodShift, notes: null };

    expect(
      fieldsOf(() => parseShiftBody({ endTime: "09:00" }, true, current))
        ?.fields.endTime,
    ).toEqual(["End time must be different from start time"]);
    expect(parseShiftBody({ endTime: "18:00" }, true, current)).toEqual({
      endTime: "18:00",
    });
  });
});
