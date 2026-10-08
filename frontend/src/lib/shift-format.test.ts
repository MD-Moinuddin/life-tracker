import { describe, expect, it } from "vitest";
import {
  formatDay,
  formatDuration,
  formatMonth,
  formatTimeRange,
  formatDateRange,
} from "./shift-format";

describe("formatDay", () => {
  it("gives the weekday, day and month", () => {
    expect(formatDay("2026-10-03")).toBe("Sat 3 Oct");
    expect(formatDay("2026-12-28")).toBe("Mon 28 Dec");
  });
});

describe("formatDateRange", () => {
  it("shows the year once for a week inside one year", () => {
    expect(formatDateRange("2026-10-05", "2026-10-11")).toBe(
      "5 Oct to 11 Oct 2026",
    );
  });

  it("shows both years for a week crossing a year end", () => {
    expect(formatDateRange("2026-12-28", "2027-01-03")).toBe(
      "28 Dec 2026 to 3 Jan 2027",
    );
  });
});

describe("formatDuration", () => {
  it.each([
    [450, "7h 30m"],
    [480, "8h"],
    [45, "45m"],
    [0, "0m"],
    [1440, "24h"],
  ])("formats %i minutes as %s", (minutes, expected) => {
    expect(formatDuration(minutes)).toBe(expected);
  });
});

describe("formatTimeRange", () => {
  it("shows start and end for a same-day shift", () => {
    expect(
      formatTimeRange({
        date: "2026-10-03",
        startTime: "09:00",
        endTime: "17:00",
        endDate: "2026-10-03",
      }),
    ).toBe("09:00 to 17:00");
  });

  it("marks a shift that ends the next day", () => {
    expect(
      formatTimeRange({
        date: "2026-10-03",
        startTime: "22:00",
        endTime: "02:00",
        endDate: "2026-10-04",
      }),
    ).toBe("22:00 to 02:00 (next day)");
  });
});

describe("formatMonth", () => {
  it("gives the month and year", () => {
    expect(formatMonth("2026-10-08")).toBe("Oct 2026");
    expect(formatMonth("2027-01-01")).toBe("Jan 2027");
  });
});
