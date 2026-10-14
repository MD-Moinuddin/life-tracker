import { describe, expect, it } from "vitest";
import {
  shiftEndDate,
  shiftEndsAt,
  shiftLengthMinutes,
  workedMinutes,
} from "./shift-time";

describe("shiftLengthMinutes", () => {
  it("measures a normal shift", () => {
    expect(shiftLengthMinutes("09:00", "17:00")).toBe(480);
  });

  it("measures an overnight shift across midnight", () => {
    expect(shiftLengthMinutes("22:00", "02:00")).toBe(240);
  });

  it("measures a shift that ends exactly at midnight", () => {
    expect(shiftLengthMinutes("22:00", "00:00")).toBe(120);
  });

  it("returns 0 when start and end are equal", () => {
    expect(shiftLengthMinutes("08:00", "08:00")).toBe(0);
  });
});

describe("workedMinutes", () => {
  it("returns the full shift when there is no break", () => {
    expect(workedMinutes("09:00", "17:00", 0)).toBe(480);
  });

  it("subtracts the break", () => {
    expect(workedMinutes("09:00", "17:00", 30)).toBe(450);
  });

  it("subtracts the break from an overnight shift", () => {
    expect(workedMinutes("22:00", "06:00", 45)).toBe(435);
  });

  it("returns 0 when the break equals the whole shift", () => {
    expect(workedMinutes("09:00", "10:00", 60)).toBe(0);
  });

  it("counts a shift that ends at midnight", () => {
    expect(workedMinutes("20:00", "00:00", 30)).toBe(210);
  });
});

describe("shiftEndDate", () => {
  it("keeps a normal shift on its start date", () => {
    expect(shiftEndDate("2026-10-03", "09:00", "17:00")).toBe("2026-10-03");
  });

  it("moves an overnight shift to the next day", () => {
    expect(shiftEndDate("2026-10-03", "22:00", "02:00")).toBe("2026-10-04");
  });

  it("moves a shift that ends at midnight to the next day", () => {
    expect(shiftEndDate("2026-10-03", "22:00", "00:00")).toBe("2026-10-04");
  });

  it("rolls over a month end", () => {
    expect(shiftEndDate("2026-10-31", "22:00", "02:00")).toBe("2026-11-01");
  });

  it("rolls over a year end", () => {
    expect(shiftEndDate("2026-12-31", "23:00", "01:00")).toBe("2027-01-01");
  });

  it("handles 28 February in a leap year and a normal year", () => {
    expect(shiftEndDate("2028-02-28", "22:00", "02:00")).toBe("2028-02-29");
    expect(shiftEndDate("2026-02-28", "22:00", "02:00")).toBe("2026-03-01");
  });
});

describe("shiftEndsAt", () => {
  it("joins the end date and the end time", () => {
    expect(shiftEndsAt("2026-10-03", "09:00", "17:00")).toBe(
      "2026-10-03T17:00",
    );
  });

  it("uses the next day for an overnight shift", () => {
    expect(shiftEndsAt("2026-10-03", "22:00", "02:00")).toBe(
      "2026-10-04T02:00",
    );
  });

  it("uses 00:00 of the next day for a shift ending at midnight", () => {
    expect(shiftEndsAt("2026-10-03", "22:00", "00:00")).toBe(
      "2026-10-04T00:00",
    );
  });
});
