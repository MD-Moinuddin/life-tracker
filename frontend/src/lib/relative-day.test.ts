import { describe, expect, it } from "vitest";
import { relativeDayLabel } from "./relative-day";

describe("relativeDayLabel", () => {
  const label = (date: string) => relativeDayLabel(date, "2026-10-30");

  it("names today and tomorrow", () => {
    expect(label("2026-10-30")).toBe("Today");
    expect(label("2026-10-31")).toBe("Tomorrow");
  });

  it("counts the days up to a week ahead, across a month end", () => {
    expect(label("2026-11-01")).toBe("In 2 days");
    expect(label("2026-11-06")).toBe("In 7 days");
  });

  it("has no label further away or in the past", () => {
    expect(label("2026-11-07")).toBeNull();
    expect(label("2026-10-29")).toBeNull();
  });
});
