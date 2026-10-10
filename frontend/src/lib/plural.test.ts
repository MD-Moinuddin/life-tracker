import { describe, expect, it } from "vitest";
import { pluralize } from "./plural";

describe("pluralize", () => {
  it("uses the singular for exactly one", () => {
    expect(pluralize(1, "shift")).toBe("1 shift");
  });

  it("uses the plural for zero and for many", () => {
    expect(pluralize(0, "shift")).toBe("0 shifts");
    expect(pluralize(3, "shift")).toBe("3 shifts");
  });
});
