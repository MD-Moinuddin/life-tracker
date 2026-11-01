import { describe, expect, it } from "vitest";
import { makeLeave, makeShift } from "../test/fixtures";
import { formatDateRange } from "./shift-format";
import {
  groupByWeek,
  groupWithLeave,
  totalsLine,
  totalsOf,
  weekTitle,
} from "./shift-groups";

describe("totalsOf", () => {
  it("adds up the count, the worked minutes and the earnings", () => {
    const totals = totalsOf([
      makeShift({ workedMinutes: 480 }),
      makeShift({ workedMinutes: 240 }),
    ]);

    expect(totals).toEqual({ count: 2, minutes: 720, cents: 14400 });
  });
});

describe("totalsLine", () => {
  const totals = { count: 2, minutes: 720, cents: 14400 };

  it("says the shift totals, and the days of paid leave only when there are some", () => {
    expect(totalsLine(totals)).toBe("2 shifts · 12h · €144.00");
    expect(totalsLine(totals, 0)).toBe("2 shifts · 12h · €144.00");
    expect(totalsLine(totals, 1)).toBe(
      "2 shifts · 12h · €144.00 · 1 day paid leave",
    );
  });

  it("can leave out the shift totals when there are no shifts", () => {
    const none = { count: 0, minutes: 0, cents: 0 };

    expect(totalsLine(none, 3)).toBe(
      "0 shifts · 0m · €0.00 · 3 days paid leave",
    );
    expect(totalsLine(none, 3, { hideNoShifts: true })).toBe(
      "3 days paid leave",
    );
    expect(totalsLine(none, 0, { hideNoShifts: true })).toBe(
      "0 shifts · 0m · €0.00",
    );
  });
});

describe("groupByWeek", () => {
  it("groups by Monday to Sunday week and keeps the order", () => {
    const weeks = groupByWeek([
      makeShift({ id: "sun", date: "2026-10-04" }),
      makeShift({ id: "mon", date: "2026-10-05" }),
      makeShift({ id: "fri", date: "2026-10-09" }),
      makeShift({ id: "next", date: "2026-10-12" }),
    ]);

    expect(weeks.map((week) => week.weekStart)).toEqual([
      "2026-09-28",
      "2026-10-05",
      "2026-10-12",
    ]);
    expect(weeks[1]?.shifts.map((shift) => shift.id)).toEqual(["mon", "fri"]);
    expect(weeks[1]?.count).toBe(2);
  });

  it("is empty for no shifts", () => {
    expect(groupByWeek([])).toEqual([]);
  });
});

describe("groupWithLeave", () => {
  const shifts = [
    makeShift({ id: "fri", date: "2026-10-09" }),
    makeShift({ id: "next", date: "2026-10-13" }),
  ];

  it("puts a leave period in the week of its start date, shift totals only", () => {
    const weeks = groupWithLeave(
      shifts,
      [
        makeLeave({
          id: "long",
          startDate: "2026-10-08",
          endDate: "2026-10-16",
        }),
      ],
      "oldest-first",
    );

    expect(weeks.map((week) => week.weekStart)).toEqual([
      "2026-10-05",
      "2026-10-12",
    ]);
    expect(weeks[0]?.leave.map((entry) => entry.id)).toEqual(["long"]);
    expect(weeks[0]?.count).toBe(1);
    expect(weeks[0]?.minutes).toBe(480);
    expect(weeks[1]?.leave).toEqual([]);
  });

  it("makes a group for a week with only leave, in order either way", () => {
    const leave = [
      makeLeave({ id: "late", startDate: "2026-10-28", endDate: "2026-10-30" }),
      makeLeave({
        id: "early",
        startDate: "2026-09-28",
        endDate: "2026-09-29",
      }),
    ];

    const oldestFirst = groupWithLeave(shifts, leave, "oldest-first");
    expect(oldestFirst.map((week) => week.weekStart)).toEqual([
      "2026-09-28",
      "2026-10-05",
      "2026-10-12",
      "2026-10-26",
    ]);
    expect(oldestFirst[0]).toMatchObject({ count: 0, minutes: 0, cents: 0 });
    expect(oldestFirst[0]?.shifts).toEqual([]);

    const newestFirst = groupWithLeave(
      [...shifts].reverse(),
      leave,
      "newest-first",
    );
    expect(newestFirst.map((week) => week.weekStart)).toEqual([
      "2026-10-26",
      "2026-10-12",
      "2026-10-05",
      "2026-09-28",
    ]);
  });

  it("orders the leave of one week by start date", () => {
    const weeks = groupWithLeave(
      [],
      [
        makeLeave({ id: "b", startDate: "2026-10-09", endDate: "2026-10-09" }),
        makeLeave({ id: "a", startDate: "2026-10-05", endDate: "2026-10-06" }),
      ],
      "oldest-first",
    );

    expect(weeks[0]?.leave.map((entry) => entry.id)).toEqual(["a", "b"]);
  });

  it("is the shift weeks with no leave when there is none", () => {
    const weeks = groupWithLeave(shifts, [], "oldest-first");

    expect(weeks).toEqual(
      groupByWeek(shifts).map((week) => ({ ...week, leave: [], leaveDays: 0 })),
    );
  });

  it("counts a group's days of paid leave as the periods' counted days", () => {
    const weeks = groupWithLeave(
      [],
      [
        makeLeave({
          id: "long",
          startDate: "2026-10-08",
          endDate: "2026-10-16",
        }),
      ],
      "oldest-first",
    );

    // Thu 8 to Fri 16 Oct, Monday to Friday: 7 days, all in the start week.
    expect(weeks).toHaveLength(1);
    expect(weeks[0]?.leaveDays).toBe(7);
  });

  describe("clamped to one week (History)", () => {
    // Thu 8 to Fri 16 Oct, Monday to Friday; it spans two weeks.
    const spanning = makeLeave({
      id: "spanning",
      startDate: "2026-10-08",
      endDate: "2026-10-16",
    });

    it("puts the period under the viewed second week, counting its past days there", () => {
      const weeks = groupWithLeave(
        [makeShift({ id: "old", date: "2026-10-13" })],
        [spanning],
        "newest-first",
        { weekStart: "2026-10-12", before: "2026-10-15" },
      );

      expect(weeks.map((week) => week.weekStart)).toEqual(["2026-10-12"]);
      expect(weeks[0]?.leave.map((entry) => entry.id)).toEqual(["spanning"]);
      // Mon 12, Tue 13, Wed 14 are before today (Thu 15).
      expect(weeks[0]?.leaveDays).toBe(3);
      expect(weeks[0]?.count).toBe(1);
    });

    it("puts the period under the viewed first week, counting only that week's days", () => {
      const weeks = groupWithLeave([], [spanning], "newest-first", {
        weekStart: "2026-10-05",
        before: "2026-10-20",
      });

      expect(weeks.map((week) => week.weekStart)).toEqual(["2026-10-05"]);
      // Thu 8 and Fri 9.
      expect(weeks[0]?.leaveDays).toBe(2);
    });
  });
});

describe("weekTitle", () => {
  const title = (weekStart: string) =>
    weekTitle(weekStart, "2026-10-07", formatDateRange);

  it("names this, next and last week", () => {
    expect(title("2026-10-05")).toBe("This week");
    expect(title("2026-10-12")).toBe("Next week");
    expect(title("2026-09-28")).toBe("Last week");
  });

  it("shows the dates of any other week", () => {
    expect(title("2026-11-16")).toBe("16 Nov to 22 Nov 2026");
  });
});
