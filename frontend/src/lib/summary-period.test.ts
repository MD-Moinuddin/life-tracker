import { describe, expect, it } from "vitest";
import {
  formatPeriod,
  rangeLabel,
  stepPeriod,
  SUMMARY_RANGES,
} from "./summary-period";

describe("stepPeriod", () => {
  it("moves a week by seven days", () => {
    expect(stepPeriod("week", "2026-10-08", 1)).toBe("2026-10-15");
    expect(stepPeriod("week", "2026-01-03", -1)).toBe("2025-12-27");
  });

  it("moves a month to the first day of the neighbouring month", () => {
    expect(stepPeriod("month", "2026-10-31", 1)).toBe("2026-11-01");
    expect(stepPeriod("month", "2026-03-31", -1)).toBe("2026-02-01");
  });

  it("crosses a year boundary", () => {
    expect(stepPeriod("month", "2026-12-15", 1)).toBe("2027-01-01");
    expect(stepPeriod("month", "2026-01-15", -1)).toBe("2025-12-01");
  });
});

describe("formatPeriod", () => {
  it("shows the Monday to Sunday range of the week", () => {
    expect(formatPeriod("week", "2026-10-07")).toBe("5 Oct to 11 Oct 2026");
  });

  it("shows the month and year", () => {
    expect(formatPeriod("month", "2026-10-07")).toBe("Oct 2026");
  });
});

describe("rangeLabel", () => {
  it("has a label for every range", () => {
    expect(SUMMARY_RANGES.map(rangeLabel)).toEqual(["Week", "Month"]);
  });
});
