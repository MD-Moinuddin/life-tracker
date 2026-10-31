import { describe, expect, it } from "vitest";
import { chipClassName } from "./chip";

describe("chipClassName", () => {
  it("is a round choice with a 44px touch target", () => {
    expect(chipClassName(false)).toContain("rounded-full");
    expect(chipClassName(false)).toContain("min-h-11");
  });

  it("draws the picked choice in the accent colour", () => {
    expect(chipClassName(true)).toContain("bg-accent-soft");
    expect(chipClassName(true)).toContain("text-accent-ink");
    expect(chipClassName(false)).toContain("bg-surface");
    expect(chipClassName(false)).not.toContain("bg-accent-soft");
  });

  it("has one horizontal padding, narrower and with a minimum width when compact", () => {
    const paddings = (className: string) =>
      className.split(" ").filter((name) => /^px-/.test(name));
    expect(paddings(chipClassName(false))).toEqual(["px-3.5"]);
    expect(paddings(chipClassName(true, "compact"))).toEqual(["px-2"]);
    expect(chipClassName(false, "compact")).toContain("min-w-12");
  });
});
