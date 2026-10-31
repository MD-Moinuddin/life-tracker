import { describe, expect, it } from "vitest";
import { isBookableRange, leaveDraftErrors } from "./leave-validation";

const christmas = {
  jobId: "job-1",
  startDate: "2026-12-21",
  endDate: "2026-12-23",
  weekdays: [1, 2, 3, 4, 5],
};

describe("leaveDraftErrors", () => {
  it("finds nothing wrong with a bookable draft", () => {
    expect(leaveDraftErrors(christmas)).toEqual({
      jobId: [],
      startDate: [],
      endDate: [],
      weekdays: [],
    });
  });

  it("asks for a job and both dates", () => {
    expect(
      leaveDraftErrors({ ...christmas, jobId: "", startDate: "", endDate: "" }),
    ).toEqual({
      jobId: ["Choose a job"],
      startDate: ["Choose a start date"],
      endDate: ["Choose an end date"],
      weekdays: [],
    });
  });

  it("keeps the dates between 1900 and 2100, as the API does", () => {
    const errors = leaveDraftErrors({
      ...christmas,
      startDate: "1899-12-31",
      endDate: "2101-01-01",
    });
    expect(errors.startDate).toEqual(["Date must be between 1900 and 2100"]);
    expect(errors.endDate).toEqual(["Date must be between 1900 and 2100"]);
  });

  it("uses the API's words for the date rules", () => {
    expect(
      leaveDraftErrors({ ...christmas, endDate: "2026-12-20" }).endDate,
    ).toEqual(["End date must not be before the start date"]);
    expect(
      leaveDraftErrors({ ...christmas, endDate: "2027-01-04" }).endDate,
    ).toEqual([
      "Paid leave cannot span two calendar years. Add one entry for each year.",
    ]);
  });

  it("asks for a day of the week, and for one that falls in the dates", () => {
    expect(leaveDraftErrors({ ...christmas, weekdays: [] }).weekdays).toEqual([
      "Pick at least one day of the week",
    ]);
    expect(
      leaveDraftErrors({ ...christmas, weekdays: [6, 0] }).weekdays,
    ).toEqual(["None of the selected days fall between these dates"]);
  });

  it("only counts days once the dates themselves are fine", () => {
    expect(
      leaveDraftErrors({ ...christmas, endDate: "2027-01-04", weekdays: [6] })
        .weekdays,
    ).toEqual([]);
  });
});

describe("isBookableRange", () => {
  it("is true for two real dates in order within one year", () => {
    expect(isBookableRange(christmas)).toBe(true);
    expect(
      isBookableRange({ startDate: "2026-12-21", endDate: "2026-12-21" }),
    ).toBe(true);
  });

  it("is false for a missing, out of range, reversed or year-crossing range", () => {
    expect(isBookableRange({ startDate: "", endDate: "2026-12-21" })).toBe(
      false,
    );
    expect(
      isBookableRange({ startDate: "0202-12-21", endDate: "0202-12-22" }),
    ).toBe(false);
    expect(
      isBookableRange({ startDate: "2026-12-21", endDate: "2026-12-20" }),
    ).toBe(false);
    expect(
      isBookableRange({ startDate: "2026-12-28", endDate: "2027-01-04" }),
    ).toBe(false);
  });
});
