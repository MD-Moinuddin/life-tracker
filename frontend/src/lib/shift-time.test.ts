import { describe, expect, it } from "vitest";
import {
  shiftEndDate,
  shiftLengthMinutes,
  timeToMinutes,
  workedMinutes,
} from "./shift-time";

describe("timeToMinutes", () => {
  it("counts the minutes since midnight", () => {
    expect(timeToMinutes("00:00")).toBe(0);
    expect(timeToMinutes("09:30")).toBe(570);
    expect(timeToMinutes("23:59")).toBe(1439);
  });
});

describe("shiftLengthMinutes", () => {
  it("is the time between start and end on the same day", () => {
    expect(shiftLengthMinutes("09:00", "17:00")).toBe(480);
  });

  it("carries over midnight when the end is earlier than the start", () => {
    expect(shiftLengthMinutes("22:00", "02:00")).toBe(240);
  });

  it("is zero when the times are equal", () => {
    expect(shiftLengthMinutes("08:00", "08:00")).toBe(0);
  });
});

describe("workedMinutes", () => {
  it("takes the break off the shift length", () => {
    expect(workedMinutes("09:00", "17:00", 30)).toBe(450);
    expect(workedMinutes("22:00", "02:00", 60)).toBe(180);
  });
});

describe("shiftEndDate", () => {
  it("is the same day for a daytime shift", () => {
    expect(shiftEndDate("2026-10-03", "09:00", "17:00")).toBe("2026-10-03");
  });

  it("is the next day when the shift runs past midnight, even over a month end", () => {
    expect(shiftEndDate("2026-10-31", "22:00", "02:00")).toBe("2026-11-01");
  });
});
