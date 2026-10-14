import { describe, expect, it } from "vitest";
import { progressPercent } from "./progress";

describe("progressPercent", () => {
  it("is the rounded share of the total", () => {
    expect(progressPercent(480, 1230)).toBe(39);
    expect(progressPercent(1, 3)).toBe(33);
    expect(progressPercent(2, 3)).toBe(67);
  });

  it("is 0 and 100 at the ends", () => {
    expect(progressPercent(0, 600)).toBe(0);
    expect(progressPercent(600, 600)).toBe(100);
  });

  it("never goes above 100 or below 0", () => {
    expect(progressPercent(700, 600)).toBe(100);
    expect(progressPercent(-5, 600)).toBe(0);
  });

  it("is 0 when there is nothing to complete", () => {
    expect(progressPercent(0, 0)).toBe(0);
    expect(progressPercent(10, 0)).toBe(0);
    expect(progressPercent(10, -1)).toBe(0);
  });
});
