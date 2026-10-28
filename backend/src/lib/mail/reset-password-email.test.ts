import { describe, expect, it } from "vitest";
import { env } from "../../config/env";
import { buildResetPasswordEmail } from "./reset-password-email";

describe("buildResetPasswordEmail", () => {
  const email = buildResetPasswordEmail({
    token: "abc-DEF_123",
    expiresInMinutes: 30,
  });
  const link = `${env.CORS_ORIGIN}/reset-password?token=abc-DEF_123`;

  it("links to the frontend reset page with the token", () => {
    expect(email.text).toContain(link);
    expect(email.html).toContain(`href="${link}"`);
  });

  it("shows the link as a button and as a copyable fallback", () => {
    expect(email.html).toContain(">Choose a new password</a>");
    expect(email.html).toContain(`>${link}</a>`);
  });

  it("escapes the link in the html", () => {
    const risky = buildResetPasswordEmail({
      token: `a"><script>x</script>`,
      expiresInMinutes: 30,
    });
    expect(risky.html).not.toContain("<script>");
  });

  it("says how long the link works", () => {
    expect(email.text).toContain("30 minutes");
    expect(email.html).toContain("30 minutes");
  });

  it("has a subject and tells a wrong recipient to ignore it", () => {
    expect(email.subject).toBe("Reset your Life Tracker password");
    expect(email.text).toContain("If you did not ask for this");
  });
});
