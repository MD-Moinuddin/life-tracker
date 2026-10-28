import { describe, expect, it } from "vitest";
import {
  forgotPasswordSchema,
  loginSchema,
  passwordSchema,
  resetPasswordSchema,
  signupSchema,
} from "./auth.schema";

describe("signupSchema", () => {
  it("lowercases the email", () => {
    const result = signupSchema.parse({
      name: "Alex",
      email: "Alex@Example.COM",
      password: "GoodPassword1",
    });

    expect(result.email).toBe("alex@example.com");
  });

  it("rejects a password longer than 72 characters", () => {
    const result = signupSchema.safeParse({
      name: "Alex",
      email: "alex@example.com",
      password: `Aa1${"a".repeat(70)}`,
    });

    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("lowercases the email", () => {
    const result = loginSchema.parse({
      email: "Alex@Example.COM",
      password: "anything",
    });

    expect(result.email).toBe("alex@example.com");
  });
});

describe("passwordSchema", () => {
  it("accepts a password that meets every rule", () => {
    expect(passwordSchema.safeParse("GoodPassword1").success).toBe(true);
  });

  it.each([
    ["Aa1aaaa", "Password must be at least 8 characters"],
    ["ALLUPPER123", "Password must contain a lowercase letter"],
    ["alllower123", "Password must contain an uppercase letter"],
    ["NoDigitsHere", "Password must contain a number"],
    [`Aa1${"a".repeat(70)}`, "Password must be at most 72 characters"],
  ])("rejects %j with a clear message", (value, message) => {
    const result = passwordSchema.safeParse(value);

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toContain(
      message,
    );
  });
});

describe("forgotPasswordSchema", () => {
  it("lowercases the email", () => {
    expect(
      forgotPasswordSchema.parse({ email: "Alex@Example.COM" }).email,
    ).toBe("alex@example.com");
  });

  it("rejects something that is not an email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "nope" }).success).toBe(
      false,
    );
  });
});

describe("resetPasswordSchema", () => {
  it("accepts a token and a valid new password", () => {
    const result = resetPasswordSchema.safeParse({
      token: "abc123",
      password: "GoodPassword1",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a missing token", () => {
    const result = resetPasswordSchema.safeParse({ password: "GoodPassword1" });

    expect(result.success).toBe(false);
  });

  it("applies the same password rules as signup", () => {
    const result = resetPasswordSchema.safeParse({
      token: "abc123",
      password: "short",
    });

    expect(result.success).toBe(false);
  });
});
