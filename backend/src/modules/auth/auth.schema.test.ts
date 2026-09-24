import { describe, expect, it } from "vitest";
import { loginSchema, signupSchema } from "./auth.schema";

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
