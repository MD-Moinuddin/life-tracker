import { describe, expect, it } from "vitest";
import { makeShift } from "../test/fixtures";
import { formatDateRange } from "./shift-format";
import { groupByWeek, totalsOf, weekTitle } from "./shift-groups";

describe("totalsOf", () => {
  it("adds up the count, the worked minutes and the earnings", () => {
    const totals = totalsOf([
      makeShift({ workedMinutes: 480 }),
      makeShift({ workedMinutes: 240 }),
    ]);

    expect(totals).toEqual({ count: 2, minutes: 720, cents: 14400 });
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
