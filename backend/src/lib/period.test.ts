import { describe, expect, it } from "vitest";
import { periodBounds } from "./period";

describe("periodBounds for a week (Monday to Sunday)", () => {
  it.each([
    ["a Monday", "2026-10-05", "2026-10-05", "2026-10-11"],
    ["a Wednesday", "2026-09-30", "2026-09-28", "2026-10-04"],
    ["a Sunday", "2026-10-04", "2026-09-28", "2026-10-04"],
    ["a week crossing a year end", "2026-12-31", "2026-12-28", "2027-01-03"],
  ])("handles %s", (_label, date, from, to) => {
    expect(periodBounds("week", date)).toEqual({ from, to });
  });
});

describe("periodBounds for a month", () => {
  it.each([
    ["a 31-day month", "2026-10-15", "2026-10-01", "2026-10-31"],
    ["a 30-day month", "2026-04-30", "2026-04-01", "2026-04-30"],
    ["February in a normal year", "2026-02-10", "2026-02-01", "2026-02-28"],
    ["February in a leap year", "2028-02-10", "2028-02-01", "2028-02-29"],
    ["the first day of a month", "2026-12-01", "2026-12-01", "2026-12-31"],
  ])("handles %s", (_label, date, from, to) => {
    expect(periodBounds("month", date)).toEqual({ from, to });
  });
});
