import { describe, expect, it } from "vitest";
import { formatEuro, parseEuroInput } from "./money";

describe("formatEuro", () => {
  it.each([
    ["13.50", "€13.50"],
    ["0.00", "€0.00"],
    ["1234.5", "€1,234.50"],
    ["999999.99", "€999,999.99"],
  ])("formats %s as %s", (amount, expected) => {
    expect(formatEuro(amount)).toBe(expected);
  });
});

describe("parseEuroInput", () => {
  it.each([
    ["13.5", "13.5"],
    ["13,5", "13.5"],
    ["13", "13"],
    ["  12,25  ", "12.25"],
    ["0,5", "0.5"],
  ])("turns %j into %j", (input, expected) => {
    expect(parseEuroInput(input)).toBe(expected);
  });

  it.each([
    "",
    "   ",
    "abc",
    "13.123",
    "-5",
    "1,234.50",
    "1.234,56",
    "13,",
    ",5",
    "€13",
    "1000000",
  ])("rejects %j", (input) => {
    expect(parseEuroInput(input)).toBeNull();
  });
});
