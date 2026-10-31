import { describe, expect, it } from "vitest";
import { ApiError } from "../api-client";
import {
  parseJobBody,
  parseLeaveBody,
  parseLeaveQuery,
  parseShiftBody,
} from "./demo-validation";

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

// The backend's example cases for the job vacation fields, with the messages
// it answers. Keep this table in step with "vacation fields" in
// backend/src/modules/jobs/job.schema.test.ts: a change there is a change here.
const jobBase = { name: "Cafe", hourlyRate: "14", type: "part_time" };
const VACATION_JOB_CASES: {
  name: string;
  body: Record<string, unknown>;
  fields: Record<string, string[]> | null;
}[] = [
  {
    name: "an allowance of 80",
    body: { vacationHoursPerYear: "80" },
    fields: null,
  },
  {
    name: "an allowance of 80.5",
    body: { vacationHoursPerYear: "80.5" },
    fields: null,
  },
  {
    name: "no allowance (null)",
    body: { vacationHoursPerYear: null },
    fields: null,
  },
  {
    name: "the edge 0.01",
    body: { vacationHoursPerYear: "0.01" },
    fields: null,
  },
  {
    name: "the edge 1000",
    body: { vacationHoursPerYear: "1000" },
    fields: null,
  },
  {
    name: "the edge 1000.00",
    body: { vacationHoursPerYear: "1000.00" },
    fields: null,
  },
  {
    name: "an allowance of 0",
    body: { vacationHoursPerYear: "0" },
    fields: {
      vacationHoursPerYear: ["Hours must be greater than 0 and at most 1000"],
    },
  },
  {
    name: "an allowance of -1",
    body: { vacationHoursPerYear: "-1" },
    fields: {
      vacationHoursPerYear: [
        "Hours must be a number with at most 2 decimals",
        "Hours must be greater than 0 and at most 1000",
      ],
    },
  },
  {
    name: "an allowance of abc",
    body: { vacationHoursPerYear: "abc" },
    fields: {
      vacationHoursPerYear: [
        "Hours must be a number with at most 2 decimals",
        "Hours must be greater than 0 and at most 1000",
      ],
    },
  },
  {
    name: "an allowance of 1000.01",
    body: { vacationHoursPerYear: "1000.01" },
    fields: {
      vacationHoursPerYear: ["Hours must be greater than 0 and at most 1000"],
    },
  },
  {
    name: "an allowance of 80.123",
    body: { vacationHoursPerYear: "80.123" },
    fields: {
      vacationHoursPerYear: ["Hours must be a number with at most 2 decimals"],
    },
  },
  {
    name: "carry-over hours without a year",
    body: { vacationHoursPerYear: "80", vacationCarryOverHours: "8" },
    fields: {
      vacationCarryOverYear: [
        "Say which year the carried-over hours belong to",
      ],
    },
  },
  {
    name: "carry-over hours with a year",
    body: {
      vacationHoursPerYear: "80",
      vacationCarryOverHours: "8",
      vacationCarryOverYear: 2026,
    },
    fields: null,
  },
  {
    name: "no carry-over hours",
    body: { vacationCarryOverHours: "0" },
    fields: null,
  },
  {
    name: "carry-over hours of -1",
    body: { vacationCarryOverHours: "-1", vacationCarryOverYear: 2026 },
    fields: {
      vacationCarryOverHours: [
        "Hours must be a number with at most 2 decimals",
        "Hours must be between 0 and 1000",
      ],
    },
  },
  {
    name: "carry-over hours of 1000.01",
    body: { vacationCarryOverHours: "1000.01", vacationCarryOverYear: 2026 },
    fields: { vacationCarryOverHours: ["Hours must be between 0 and 1000"] },
  },
  {
    name: "carry-over hours of abc",
    body: { vacationCarryOverHours: "abc", vacationCarryOverYear: 2026 },
    fields: {
      vacationCarryOverHours: [
        "Hours must be a number with at most 2 decimals",
        "Hours must be between 0 and 1000",
      ],
    },
  },
  {
    name: "a carry-over year of 1999",
    body: { vacationCarryOverHours: "8", vacationCarryOverYear: 1999 },
    fields: {
      vacationCarryOverYear: ["Too small: expected number to be >=2000"],
    },
  },
  {
    name: "a carry-over year of 2101",
    body: { vacationCarryOverHours: "8", vacationCarryOverYear: 2101 },
    fields: {
      vacationCarryOverYear: ["Too big: expected number to be <=2100"],
    },
  },
  {
    name: "a carry-over year of 2026.5",
    body: { vacationCarryOverHours: "8", vacationCarryOverYear: 2026.5 },
    fields: {
      vacationCarryOverYear: ["Invalid input: expected int, received number"],
    },
  },
];

describe("parseJobBody, vacation fields", () => {
  it.each(VACATION_JOB_CASES)("$name", ({ body, fields }) => {
    const result = fieldsOf(() => parseJobBody({ ...jobBase, ...body }, false));

    expect(result?.fields ?? null).toEqual(fields);
  });

  it("stores the hours with 2 decimals, like the database", () => {
    expect(
      parseJobBody(
        {
          ...jobBase,
          vacationHoursPerYear: "80",
          vacationCarryOverHours: "8.5",
          vacationCarryOverYear: 2026,
        },
        false,
      ),
    ).toMatchObject({
      vacationHoursPerYear: "80.00",
      vacationCarryOverHours: "8.50",
      vacationCarryOverYear: 2026,
    });
  });

  it("applies the same rules to an update, which can turn tracking off", () => {
    expect(parseJobBody({ vacationHoursPerYear: "88" }, true)).toEqual({
      vacationHoursPerYear: "88.00",
    });
    expect(parseJobBody({ vacationHoursPerYear: null }, true)).toEqual({
      vacationHoursPerYear: null,
    });
    expect(
      fieldsOf(() => parseJobBody({ vacationCarryOverHours: "5" }, true))
        ?.fields,
    ).toEqual({
      vacationCarryOverYear: [
        "Say which year the carried-over hours belong to",
      ],
    });
  });
});

// Monday 9 March to Friday 13 March 2026, the backend tests' week.
const validLeave = {
  jobId: "job-1",
  startDate: "2026-03-09",
  endDate: "2026-03-13",
  weekdays: [1, 2, 3, 4, 5],
  minutesPerDay: 240,
};

const WEEKDAY_MESSAGE = "Pick at least one day of the week";
const MINUTES_MESSAGE = "Hours per day must be between 15 minutes and 12 hours";
const FORMAT_MESSAGE = "Date must be a real date in YYYY-MM-DD format";
const YEARS_MESSAGE =
  "Paid leave cannot span two calendar years. Add one entry for each year.";

// The backend's example cases for a new leave entry, with the field messages
// it answers. Keep this table in step with "createLeaveSchema" in
// backend/src/modules/leave/leave.schema.test.ts: a change there is a change
// here.
const CREATE_LEAVE_CASES: {
  name: string;
  body: Record<string, unknown>;
  fields: Record<string, string[]> | null;
}[] = [
  { name: "a valid week", body: {}, fields: null },
  {
    name: "an end date before the start date",
    body: { startDate: "2026-03-13", endDate: "2026-03-09" },
    fields: { endDate: ["End date must not be before the start date"] },
  },
  {
    name: "a range across two calendar years",
    body: { startDate: "2026-12-28", endDate: "2027-01-02" },
    fields: { endDate: [YEARS_MESSAGE] },
  },
  {
    name: "empty weekdays",
    body: { weekdays: [] },
    fields: { weekdays: [WEEKDAY_MESSAGE] },
  },
  {
    name: "missing weekdays",
    body: { weekdays: undefined },
    fields: { weekdays: [WEEKDAY_MESSAGE] },
  },
  {
    name: "a repeated weekday",
    body: { weekdays: [1, 1, 2] },
    fields: { weekdays: ["Each day can only be picked once"] },
  },
  {
    name: "the weekday 7",
    body: { weekdays: [7] },
    fields: { weekdays: [WEEKDAY_MESSAGE] },
  },
  {
    name: "the weekday -1",
    body: { weekdays: [-1] },
    fields: { weekdays: [WEEKDAY_MESSAGE] },
  },
  {
    name: "the weekday 1.5",
    body: { weekdays: [1.5] },
    fields: { weekdays: [WEEKDAY_MESSAGE] },
  },
  {
    name: "the weekdays 1 and 8",
    body: { weekdays: [1, 8] },
    fields: { weekdays: [WEEKDAY_MESSAGE] },
  },
  { name: "15 minutes per day", body: { minutesPerDay: 15 }, fields: null },
  { name: "720 minutes per day", body: { minutesPerDay: 720 }, fields: null },
  {
    name: "14 minutes per day",
    body: { minutesPerDay: 14 },
    fields: { minutesPerDay: [MINUTES_MESSAGE] },
  },
  {
    name: "721 minutes per day",
    body: { minutesPerDay: 721 },
    fields: { minutesPerDay: [MINUTES_MESSAGE] },
  },
  {
    name: "90.5 minutes per day",
    body: { minutesPerDay: 90.5 },
    fields: { minutesPerDay: [MINUTES_MESSAGE] },
  },
  {
    name: '"240" minutes per day',
    body: { minutesPerDay: "240" },
    fields: { minutesPerDay: [MINUTES_MESSAGE] },
  },
  {
    name: "a range with no counted day",
    body: { startDate: "2026-03-14", endDate: "2026-03-14" },
    fields: {
      weekdays: ["None of the selected days fall between these dates"],
    },
  },
  {
    name: "a date that is not real",
    body: { startDate: "2026-02-30" },
    fields: { startDate: [FORMAT_MESSAGE] },
  },
  {
    name: "dates that are not dates",
    body: { startDate: "1", endDate: "1" },
    fields: { startDate: [FORMAT_MESSAGE], endDate: [FORMAT_MESSAGE] },
  },
  {
    name: "dates in year 0000",
    body: { startDate: "0000-01-01", endDate: "0000-01-05" },
    fields: {
      startDate: ["Date must be between 1900 and 2100"],
      endDate: ["Date must be between 1900 and 2100"],
    },
  },
  {
    name: "a missing job",
    body: { jobId: "" },
    fields: { jobId: ["Job is required"] },
  },
  {
    name: "notes longer than 500 characters",
    body: { notes: "a".repeat(501) },
    fields: { notes: ["Notes must be at most 500 characters"] },
  },
  {
    name: "a missing job and dates in the wrong order, both reported",
    body: { jobId: "", startDate: "2026-03-13", endDate: "2026-03-09" },
    fields: {
      jobId: ["Job is required"],
      endDate: ["End date must not be before the start date"],
    },
  },
];

describe("parseLeaveBody", () => {
  it.each(CREATE_LEAVE_CASES)("$name", ({ body, fields }) => {
    const result = fieldsOf(() =>
      parseLeaveBody({ ...validLeave, ...body }, false),
    );

    expect(result?.status ?? 400).toBe(400);
    expect(result?.fields ?? null).toEqual(fields);
  });

  it("trims notes, turns blank notes into null and keeps the option to remove shifts", () => {
    expect(
      parseLeaveBody({ ...validLeave, notes: "  Summer trip  " }, false).notes,
    ).toBe("Summer trip");
    expect(parseLeaveBody({ ...validLeave, notes: "   " }, false).notes).toBe(
      null,
    );
    expect(
      parseLeaveBody({ ...validLeave, removeOverlappingShifts: true }, false)
        .removeOverlappingShifts,
    ).toBe(true);
  });

  it("only checks the fields it is sent for an update, and drops the remove-shifts option", () => {
    expect(parseLeaveBody({ minutesPerDay: 120 }, true)).toEqual({
      minutesPerDay: 120,
    });
    expect(
      parseLeaveBody(
        { minutesPerDay: 120, removeOverlappingShifts: true },
        true,
      ),
    ).toEqual({ minutesPerDay: 120 });
    expect(parseLeaveBody({ notes: "" }, true)).toEqual({ notes: null });
  });

  it("refuses an empty update, and one with only the remove-shifts option", () => {
    const message = { form: ["Provide at least one field to update"] };

    expect(fieldsOf(() => parseLeaveBody({}, true))?.fields).toEqual(message);
    expect(
      fieldsOf(() => parseLeaveBody({ removeOverlappingShifts: true }, true))
        ?.fields,
    ).toEqual(message);
  });

  it("checks an update's dates against the entry it changes", () => {
    const current = { ...validLeave, notes: null };

    expect(
      fieldsOf(() => parseLeaveBody({ endDate: "2026-03-01" }, true, current))
        ?.fields,
    ).toEqual({ endDate: ["End date must not be before the start date"] });
    expect(
      fieldsOf(() => parseLeaveBody({ weekdays: [0, 6] }, true, current))
        ?.fields,
    ).toEqual({
      weekdays: ["None of the selected days fall between these dates"],
    });
    expect(parseLeaveBody({ endDate: "2026-03-11" }, true, current)).toEqual({
      endDate: "2026-03-11",
    });
  });
});

describe("parseLeaveQuery", () => {
  it("accepts from, to and jobId, or nothing", () => {
    expect(
      parseLeaveQuery(
        new URLSearchParams("from=2026-03-01&to=2026-03-31&jobId=job-1"),
      ),
    ).toEqual({ from: "2026-03-01", to: "2026-03-31", jobId: "job-1" });
    expect(parseLeaveQuery(new URLSearchParams())).toEqual({});
  });

  it("refuses a from date after the to date, on the to field, and a bad date", () => {
    expect(
      fieldsOf(() =>
        parseLeaveQuery(new URLSearchParams("from=2026-04-01&to=2026-03-01")),
      )?.fields,
    ).toEqual({ to: ["From date must not be after the to date"] });
    expect(
      fieldsOf(() => parseLeaveQuery(new URLSearchParams("from=x")))?.fields,
    ).toEqual({ from: [FORMAT_MESSAGE] });
  });
});

describe("parseShiftBody, dates", () => {
  it("keeps the date between 1900 and 2100, as the API does", () => {
    expect(
      fieldsOf(() =>
        parseShiftBody({ ...goodShift, date: "0000-01-01" }, false),
      )?.fields,
    ).toEqual({ date: ["Date must be between 1900 and 2100"] });
  });
});
