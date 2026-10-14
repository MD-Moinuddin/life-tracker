import { describe, expect, it } from "vitest";
import { contrastRatio } from "./contrast";

describe("contrastRatio", () => {
  it("is 21 for black on white", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
  });

  it("is 1 for identical colours", () => {
    expect(contrastRatio("#4f46e5", "#4f46e5")).toBeCloseTo(1, 5);
  });

  it("does not depend on the order of the colours", () => {
    expect(contrastRatio("#1b1f3b", "#ffffff")).toBe(
      contrastRatio("#ffffff", "#1b1f3b"),
    );
  });

  it("matches a known value (white on indigo-600 is about 6.3)", () => {
    expect(contrastRatio("#ffffff", "#4f46e5")).toBeCloseTo(6.29, 1);
  });
});
