import { describe, expect, it } from "vitest";
import { calculatorHours, parseHoursInput } from "./vacation-input";

describe("parseHoursInput", () => {
  it("accepts a number above 0 and at most 1000 with at most 2 decimals", () => {
    expect(parseHoursInput("80")).toBe("80");
    expect(parseHoursInput(" 80,5 ")).toBe("80.5");
    expect(parseHoursInput("1000")).toBe("1000");
    expect(parseHoursInput("0.25")).toBe("0.25");
  });

  it("rejects text, zero, too many hours and too many decimals", () => {
    for (const input of ["", "abc", "0", "0.00", "1000.01", "1001", "80.123"]) {
      expect(parseHoursInput(input)).toBeNull();
    }
  });

  it("strips leading zeros from the value it returns", () => {
    expect(parseHoursInput("0080")).toBe("80");
    expect(parseHoursInput("00.5")).toBe("0.5");
    expect(parseHoursInput("0", { allowZero: true })).toBe("0");
    expect(parseHoursInput("00", { allowZero: true })).toBe("0");
  });

  it("allows zero when asked to", () => {
    expect(parseHoursInput("0", { allowZero: true })).toBe("0");
    expect(parseHoursInput("-1", { allowZero: true })).toBeNull();
  });
});

describe("calculatorHours", () => {
  it("is four weeks of the weekly hours", () => {
    expect(calculatorHours("20")).toBe("80");
    expect(calculatorHours("22")).toBe("88");
    expect(calculatorHours("22,5")).toBe("90");
    expect(calculatorHours("22.3")).toBe("89.2");
  });

  it("is 0 for anything that is not a number", () => {
    expect(calculatorHours("")).toBe("0");
    expect(calculatorHours("abc")).toBe("0");
  });
});
