import { describe, expect, it } from "vitest";
import { addDays, hasEnded, localNow, weekBounds } from "./dates";

describe("localNow", () => {
  it("formats the local date and time as YYYY-MM-DDTHH:mm", () => {
    expect(localNow(new Date(2026, 9, 3, 14, 30))).toBe("2026-10-03T14:30");
  });

  it("pads single digits", () => {
    expect(localNow(new Date(2026, 0, 2, 3, 4))).toBe("2026-01-02T03:04");
  });
});

describe("addDays", () => {
  it.each([
    ["2026-10-03", 1, "2026-10-04"],
    ["2026-10-31", 1, "2026-11-01"],
    ["2026-12-31", 1, "2027-01-01"],
    ["2028-02-28", 1, "2028-02-29"],
    ["2026-03-01", -1, "2026-02-28"],
    ["2026-10-05", -7, "2026-09-28"],
  ])("adds %s + %i days to give %s", (date, days, expected) => {
    expect(addDays(date, days)).toBe(expected);
  });
});

describe("weekBounds (Monday to Sunday)", () => {
  it.each([
    ["a Monday", "2026-10-05", "2026-10-05", "2026-10-11"],
    ["a Wednesday", "2026-09-30", "2026-09-28", "2026-10-04"],
    ["a Sunday", "2026-10-04", "2026-09-28", "2026-10-04"],
    ["a week crossing a year end", "2026-12-31", "2026-12-28", "2027-01-03"],
  ])("handles %s", (_label, date, from, to) => {
    expect(weekBounds(date)).toEqual({ from, to });
  });
});

describe("hasEnded", () => {
  const shift = { endDate: "2026-10-04", endTime: "02:00" };

  it.each([
    ["well after it ends", "2026-10-04T09:00", true],
    ["exactly when it ends", "2026-10-04T02:00", true],
    ["a minute before it ends", "2026-10-04T01:59", false],
    ["on the evening it starts", "2026-10-03T23:00", false],
  ])("is judged %s", (_label, now, expected) => {
    expect(hasEnded(shift, now)).toBe(expected);
  });
});
