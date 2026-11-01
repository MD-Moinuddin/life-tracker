import { describe, expect, it } from "vitest";
import { countedDays, daysInRange } from "./leave-days";

const WORKDAYS = [1, 2, 3, 4, 5];

describe("countedDays", () => {
  it("counts the matching weekdays of a week", () => {
    expect(countedDays("2026-03-09", "2026-03-13", WORKDAYS)).toEqual([
      "2026-03-09",
      "2026-03-10",
      "2026-03-11",
      "2026-03-12",
      "2026-03-13",
    ]);
  });

  it("skips the days of the week that do not count", () => {
    expect(countedDays("2026-03-07", "2026-03-15", WORKDAYS)).toHaveLength(5);
    expect(
      countedDays("2026-03-07", "2026-03-15", [0, 1, 2, 3, 4, 5, 6]),
    ).toHaveLength(9);
  });

  it("handles a single day, counted or not", () => {
    expect(countedDays("2026-03-09", "2026-03-09", WORKDAYS)).toEqual([
      "2026-03-09",
    ]);
    expect(countedDays("2026-03-08", "2026-03-08", WORKDAYS)).toEqual([]);
  });

  it("is empty when the end is before the start", () => {
    expect(countedDays("2026-03-13", "2026-03-09", WORKDAYS)).toEqual([]);
  });

  it("crosses a year end", () => {
    expect(countedDays("2026-12-31", "2027-01-04", WORKDAYS)).toEqual([
      "2026-12-31",
      "2027-01-01",
      "2027-01-04",
    ]);
  });

  it("crosses a month end", () => {
    expect(countedDays("2026-10-29", "2026-11-02", WORKDAYS)).toEqual([
      "2026-10-29",
      "2026-10-30",
      "2026-11-02",
    ]);
  });
});

describe("daysInRange", () => {
  it("keeps the days inside a range, both ends included", () => {
    const days = countedDays("2026-10-26", "2026-11-06", WORKDAYS);
    expect(daysInRange(days, "2026-11-01", "2026-11-03")).toEqual([
      "2026-11-02",
      "2026-11-03",
    ]);
  });
});
