import { describe, expect, it } from "vitest";
import { envSchema } from "./env";

const base = {
  DATABASE_URL: "postgresql://x",
  CORS_ORIGIN: "http://localhost:5173",
  JWT_ACCESS_SECRET: "a",
  JWT_REFRESH_SECRET: "b",
};

describe("envSchema mail settings", () => {
  it("needs no mail settings in development", () => {
    expect(
      envSchema.safeParse({ ...base, NODE_ENV: "development" }).success,
    ).toBe(true);
  });

  it("defaults the sender name", () => {
    const result = envSchema.parse({ ...base, NODE_ENV: "development" });

    expect(result.MAIL_FROM_NAME).toBe("Life Tracker");
  });

  it("requires BREVO_API_KEY and MAIL_FROM_EMAIL in production", () => {
    const result = envSchema.safeParse({ ...base, NODE_ENV: "production" });

    expect(result.success).toBe(false);
    const paths = result.error?.issues.map((issue) => issue.path.join("."));
    expect(paths).toContain("BREVO_API_KEY");
    expect(paths).toContain("MAIL_FROM_EMAIL");
  });

  it("accepts production with both mail settings", () => {
    const result = envSchema.safeParse({
      ...base,
      NODE_ENV: "production",
      BREVO_API_KEY: "key",
      MAIL_FROM_EMAIL: "sender@example.com",
    });

    expect(result.success).toBe(true);
  });

  it("requires a sender address whenever a key is set", () => {
    const result = envSchema.safeParse({
      ...base,
      NODE_ENV: "development",
      BREVO_API_KEY: "key",
    });

    expect(result.success).toBe(false);
  });
});
