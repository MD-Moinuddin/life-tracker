import { describe, expect, it } from "vitest";
import { isValidEmail } from "./auth-validation";

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
