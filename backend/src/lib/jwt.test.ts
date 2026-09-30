import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import { env } from "../config/env";
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "./jwt";

function base64Url(value: object) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

describe("jwt helpers", () => {
  it("round-trips an access token and a refresh token", () => {
    expect(verifyAccessToken(signAccessToken("user-1"))).toEqual({
      sub: "user-1",
    });
    expect(verifyRefreshToken(signRefreshToken("user-1"))).toEqual({
      sub: "user-1",
    });
  });

  it("signs with HS256", () => {
    const decoded = jwt.decode(signAccessToken("user-1"), { complete: true });

    expect(decoded?.header.alg).toBe("HS256");
  });

  it("does not accept a refresh token as an access token or the reverse", () => {
    expect(() => verifyAccessToken(signRefreshToken("user-1"))).toThrow();
    expect(() => verifyRefreshToken(signAccessToken("user-1"))).toThrow();
  });

  it("rejects a token signed with a different algorithm and the same secret", () => {
    const token = jwt.sign({ sub: "user-1" }, env.JWT_ACCESS_SECRET, {
      algorithm: "HS512",
    });

    expect(() => verifyAccessToken(token)).toThrow();
  });

  it("rejects an unsigned token that claims alg none", () => {
    const token = `${base64Url({ alg: "none", typ: "JWT" })}.${base64Url({ sub: "user-1" })}.`;

    expect(() => verifyAccessToken(token)).toThrow();
  });

  it("rejects a signed token with no sub", () => {
    const token = jwt.sign({}, env.JWT_ACCESS_SECRET, { algorithm: "HS256" });

    expect(() => verifyAccessToken(token)).toThrow("Invalid token payload");
  });

  it("rejects a signed token whose sub is not a string", () => {
    const token = jwt.sign({ sub: 123 }, env.JWT_ACCESS_SECRET, {
      algorithm: "HS256",
    });

    expect(() => verifyAccessToken(token)).toThrow("Invalid token payload");
  });

  it("rejects an expired token", () => {
    const token = jwt.sign({ sub: "user-1" }, env.JWT_ACCESS_SECRET, {
      expiresIn: -10,
    });

    expect(() => verifyAccessToken(token)).toThrow();
  });
});
