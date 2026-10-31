import { describe, expect, it } from "vitest";
import { makeLeave } from "../test/fixtures";
import {
  countedDays,
  daysInRange,
  isLeaveDayTaken,
  isLeavePlanned,
  leaveDayCents,
  leaveDaysIn,
  leaveDaysInWeek,
  leaveTotals,
} from "./leave-days";

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

describe("leaveDaysIn", () => {
  it("gives the counted days of an entry inside a range", () => {
    // 9 to 13 March, Monday to Friday.
    expect(leaveDaysIn(makeLeave(), "2026-03-11", "2026-03-15")).toEqual([
      "2026-03-11",
      "2026-03-12",
      "2026-03-13",
    ]);
    expect(leaveDaysIn(makeLeave(), "2026-03-14", "2026-03-15")).toEqual([]);
  });
});

describe("leaveTotals", () => {
  it("adds up days, minutes and pay", () => {
    expect(
      leaveTotals({
        startDate: "2026-03-09",
        endDate: "2026-03-13",
        weekdays: [1, 2, 3, 4, 5],
        minutesPerDay: 240,
        job: { hourlyRate: "14.00" },
      }),
    ).toEqual({ days: 5, minutes: 1200, cents: 28000 });
  });
});

describe("leaveDayCents", () => {
  it("is the pay of one counted day", () => {
    // 4h at 14.00.
    expect(leaveDayCents(makeLeave())).toBe(5600);
  });
});

describe("isLeaveDayTaken", () => {
  it("counts a day before today as taken, today and later as planned", () => {
    expect(isLeaveDayTaken("2026-10-06", "2026-10-07")).toBe(true);
    expect(isLeaveDayTaken("2026-10-07", "2026-10-07")).toBe(false);
    expect(isLeaveDayTaken("2026-10-08", "2026-10-07")).toBe(false);
  });
});

describe("isLeavePlanned", () => {
  it("is planned while its last day is today or later", () => {
    const leave = { endDate: "2026-10-07" };
    expect(isLeavePlanned(leave, "2026-10-06")).toBe(true);
    expect(isLeavePlanned(leave, "2026-10-07")).toBe(true);
    expect(isLeavePlanned(leave, "2026-10-08")).toBe(false);
  });
});

describe("leaveDaysInWeek", () => {
  it("counts the counted days of all the leave inside the Monday to Sunday week", () => {
    const leave = [
      // Thu 1 to Tue 6 Oct: Mon 5 and Tue 6 fall in the week.
      makeLeave({ startDate: "2026-10-01", endDate: "2026-10-06" }),
      // Fri 9 to Mon 12 Oct, workdays: only Fri 9 falls in the week.
      makeLeave({
        id: "leave-2",
        startDate: "2026-10-09",
        endDate: "2026-10-12",
        weekdays: WORKDAYS,
      }),
    ];

    expect(leaveDaysInWeek(leave, "2026-10-05")).toBe(3);
  });

  it("is zero without leave", () => {
    expect(leaveDaysInWeek([], "2026-10-05")).toBe(0);
  });
});
