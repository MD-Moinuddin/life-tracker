import { describe, expect, it } from "vitest";
import { classNames } from "./class-names";

describe("classNames", () => {
  it("joins the parts with a space", () => {
    expect(classNames("a", "b")).toBe("a b");
  });

  it("skips false, null, undefined and empty strings", () => {
    expect(classNames("a", false, null, undefined, "", "b")).toBe("a b");
  });

  it("returns an empty string when nothing is left", () => {
    expect(classNames(false, undefined)).toBe("");
  });
});
