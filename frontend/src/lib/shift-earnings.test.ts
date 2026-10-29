import { describe, expect, it } from "vitest";
import { makeShift } from "../test/fixtures";
import { formatCents, shiftEarningsCents } from "./shift-earnings";

function earn(hourlyRate: string, workedMinutes: number) {
  return shiftEarningsCents(
    makeShift({
      job: { id: "j", name: "J", hourlyRate, type: "part_time" },
      workedMinutes,
    }),
  );
}

describe("shiftEarningsCents", () => {
  it("multiplies the rate by the worked time", () => {
    expect(earn("12.00", 480)).toBe(9600);
    expect(earn("12.50", 225)).toBe(4688);
  });

  it("rounds half a cent up, like the summary", () => {
    // 10.01 EUR x 30 min = 5.005 EUR
    expect(earn("10.01", 30)).toBe(501);
  });

  it("is zero for no worked time", () => {
    expect(earn("12.00", 0)).toBe(0);
  });
});

describe("formatCents", () => {
  it("formats whole cents as euros", () => {
    expect(formatCents(4688)).toBe("€46.88");
  });
});
