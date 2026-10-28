import { describe, expect, it } from "vitest";
import {
  createResetToken,
  hashResetToken,
  PASSWORD_RESET_COOLDOWN_MS,
  PASSWORD_RESET_TTL_MS,
} from "./reset-token";

describe("reset token", () => {
  it("creates a base64url token of 32 random bytes", () => {
    const { token } = createResetToken();

    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("creates a different token every time", () => {
    expect(createResetToken().token).not.toBe(createResetToken().token);
  });

  it("returns the SHA-256 hex digest of the token, never the token itself", () => {
    const { token, tokenHash } = createResetToken();

    expect(tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(tokenHash).toBe(hashResetToken(token));
    expect(tokenHash).not.toContain(token);
  });

  it("hashes deterministically", () => {
    expect(hashResetToken("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("lives 30 minutes and has a 60 second cooldown", () => {
    expect(PASSWORD_RESET_TTL_MS).toBe(30 * 60 * 1000);
    expect(PASSWORD_RESET_COOLDOWN_MS).toBe(60 * 1000);
  });
});
