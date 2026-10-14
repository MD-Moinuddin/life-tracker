import { describe, expect, it } from "vitest";
import { greeting } from "./greeting";

describe("greeting", () => {
  it.each([
    ["2026-10-07T00:00", "Good morning"],
    ["2026-10-07T05:30", "Good morning"],
    ["2026-10-07T11:59", "Good morning"],
    ["2026-10-07T12:00", "Good afternoon"],
    ["2026-10-07T17:59", "Good afternoon"],
    ["2026-10-07T18:00", "Good evening"],
    ["2026-10-07T23:59", "Good evening"],
  ])("at %s says %s", (now, expected) => {
    expect(greeting(now)).toBe(expected);
  });

  it("adds the first name", () => {
    expect(greeting("2026-10-07T19:30", "Md Moinuddin")).toBe(
      "Good evening, Md",
    );
  });

  it("ignores extra spaces around the name", () => {
    expect(greeting("2026-10-07T09:00", "  Md   Moinuddin ")).toBe(
      "Good morning, Md",
    );
  });

  it("leaves the name out when it is missing or blank", () => {
    expect(greeting("2026-10-07T09:00", undefined)).toBe("Good morning");
    expect(greeting("2026-10-07T09:00", "")).toBe("Good morning");
    expect(greeting("2026-10-07T09:00", "   ")).toBe("Good morning");
  });
});
