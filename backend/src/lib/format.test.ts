import { describe, expect, it } from "vitest";
import { formatUptime } from "./format";

describe("formatUptime", () => {
  it("formats zero seconds", () => {
    expect(formatUptime(0)).toBe("0h 0m");
  });

  it("formats less than an hour", () => {
    expect(formatUptime(125)).toBe("0h 2m");
  });

  it("formats exactly one hour", () => {
    expect(formatUptime(3600)).toBe("1h 0m");
  });

  it("formats hours and minutes together", () => {
    expect(formatUptime(3900)).toBe("1h 5m");
  });
});
