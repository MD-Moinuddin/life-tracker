import { describe, expect, it } from "vitest";
import { isValidEmail, passwordErrors } from "./auth-validation";

describe("isValidEmail", () => {
  it.each(["md@example.com", "a.b+c@sub.example.org", "x@y.z"])(
    "accepts %s",
    (email) => {
      expect(isValidEmail(email)).toBe(true);
    },
  );

  it.each([
    "",
    "md",
    "md@example",
    "@example.com",
    "md@@example.com",
    "md @example.com",
  ])("rejects %j", (email) => {
    expect(isValidEmail(email)).toBe(false);
  });
});

describe("passwordErrors", () => {
  it("has no errors for a password that meets every rule", () => {
    expect(passwordErrors("GoodPassword1")).toEqual([]);
  });

  it("lists every rule that is broken", () => {
    expect(passwordErrors("abc")).toEqual([
      "Password must be at least 8 characters",
      "Password must contain an uppercase letter",
      "Password must contain a number",
    ]);
  });

  it("rejects a password longer than 72 characters", () => {
    expect(passwordErrors(`Aa1${"a".repeat(70)}`)).toEqual([
      "Password must be at most 72 characters",
    ]);
  });
});
