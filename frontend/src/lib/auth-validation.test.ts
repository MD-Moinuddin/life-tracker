import { describe, expect, it } from "vitest";
import {
  PASSWORD_RULES,
  PASSWORD_RULES_MESSAGE,
  PASSWORD_TOO_LONG_MESSAGE,
  isValidEmail,
  newPasswordError,
  passwordErrors,
} from "./auth-validation";

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

describe("PASSWORD_RULES", () => {
  it("accepts exactly what passwordErrors accepts, within the length limit", () => {
    for (const password of ["abc", "abcdefgh", "ABCDEFGH1", "Abcdefg1", ""]) {
      const allMet = PASSWORD_RULES.every((rule) => rule.test(password));
      expect(allMet).toBe(passwordErrors(password).length === 0);
    }
  });

  it("words each rule as a short label", () => {
    expect(PASSWORD_RULES.map((rule) => rule.label)).toEqual([
      "8 or more characters",
      "A lowercase letter",
      "An uppercase letter",
      "A number",
    ]);
  });
});

describe("newPasswordError", () => {
  it("is nothing for a good password", () => {
    expect(newPasswordError("Abcdefg1")).toBeNull();
  });

  it("is one line for a password that breaks any rule", () => {
    expect(newPasswordError("abc")).toBe(PASSWORD_RULES_MESSAGE);
    expect(newPasswordError("abcdefgh1")).toBe(PASSWORD_RULES_MESSAGE);
  });

  it("names the upper limit separately", () => {
    expect(newPasswordError(`Aa1${"x".repeat(70)}`)).toBe(
      PASSWORD_TOO_LONG_MESSAGE,
    );
  });
});
