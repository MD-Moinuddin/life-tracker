import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as jwt from "../../lib/jwt";
import { sendMail } from "../../lib/mail/send-mail";
import * as password from "../../lib/password";
import * as repository from "./auth.repository";
import {
  EmailAlreadyRegisteredError,
  InvalidRefreshTokenError,
  InvalidResetTokenError,
  refresh,
  requestPasswordReset,
  resetPassword,
  signup,
} from "./auth.service";
import { hashResetToken } from "./reset-token";

vi.mock("./auth.repository", () => ({
  findUserByEmail: vi.fn(),
  findUserById: vi.fn(),
  createUser: vi.fn(),
  findLatestResetTokenCreatedAt: vi.fn(),
  replaceResetToken: vi.fn(),
  resetPasswordWithToken: vi.fn(),
}));
vi.mock("../../lib/mail/send-mail", () => ({ sendMail: vi.fn() }));
vi.mock("../../lib/password", () => ({
  hashPassword: vi.fn(),
  comparePassword: vi.fn(),
}));
vi.mock("../../lib/jwt", () => ({
  signAccessToken: vi.fn(),
  signRefreshToken: vi.fn(),
  verifyRefreshToken: vi.fn(),
}));

const existingUser = {
  id: "1",
  name: "Alex",
  email: "a@b.com",
  passwordHash: "existing-hash",
  passwordChangedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("signup", () => {
  it("rejects a duplicate email", async () => {
    vi.mocked(repository.findUserByEmail).mockResolvedValue(existingUser);

    await expect(
      signup({ name: "Alex", email: "a@b.com", password: "GoodPassword1" }),
    ).rejects.toThrow(EmailAlreadyRegisteredError);

    expect(repository.createUser).not.toHaveBeenCalled();
  });

  it("hashes the password before storing it", async () => {
    vi.mocked(repository.findUserByEmail).mockResolvedValue(null);
    vi.mocked(password.hashPassword).mockResolvedValue("hashed-value");
    vi.mocked(repository.createUser).mockResolvedValue({
      ...existingUser,
      passwordHash: "hashed-value",
    });

    await signup({
      name: "New User",
      email: "new@example.com",
      password: "GoodPassword1",
    });

    expect(password.hashPassword).toHaveBeenCalledWith("GoodPassword1");
    expect(repository.createUser).toHaveBeenCalledWith({
      name: "New User",
      email: "new@example.com",
      passwordHash: "hashed-value",
    });
  });

  it("never returns the password hash", async () => {
    vi.mocked(repository.findUserByEmail).mockResolvedValue(null);
    vi.mocked(password.hashPassword).mockResolvedValue("hashed-value");
    vi.mocked(repository.createUser).mockResolvedValue({
      ...existingUser,
      passwordHash: "hashed-value",
    });

    const result = await signup({
      name: "New User",
      email: "new@example.com",
      password: "GoodPassword1",
    });

    expect(result).not.toHaveProperty("passwordHash");
  });

  it("reports a duplicate email when the database rejects the insert", async () => {
    vi.mocked(repository.findUserByEmail).mockResolvedValue(null);
    vi.mocked(password.hashPassword).mockResolvedValue("hashed-value");
    vi.mocked(repository.createUser).mockRejectedValueOnce({ code: "P2002" });

    await expect(
      signup({ name: "Alex", email: "a@b.com", password: "GoodPassword1" }),
    ).rejects.toThrow(EmailAlreadyRegisteredError);
  });

  it("rethrows other database errors unchanged", async () => {
    vi.mocked(repository.findUserByEmail).mockResolvedValue(null);
    vi.mocked(password.hashPassword).mockResolvedValue("hashed-value");
    vi.mocked(repository.createUser).mockRejectedValueOnce(
      new Error("database is down"),
    );

    await expect(
      signup({ name: "Alex", email: "a@b.com", password: "GoodPassword1" }),
    ).rejects.toThrow("database is down");
  });
});

describe("refresh", () => {
  it("rejects an invalid or expired token", async () => {
    vi.mocked(jwt.verifyRefreshToken).mockImplementation(() => {
      throw new Error("invalid token");
    });

    await expect(refresh("bad-token")).rejects.toThrow(
      InvalidRefreshTokenError,
    );
  });

  it("rejects a valid token whose user no longer exists", async () => {
    vi.mocked(jwt.verifyRefreshToken).mockReturnValue({ sub: "1", iat: 1_000 });
    vi.mocked(repository.findUserById).mockResolvedValue(null);

    await expect(refresh("valid-token")).rejects.toThrow(
      InvalidRefreshTokenError,
    );
  });

  it("returns a new access token and the user on success", async () => {
    vi.mocked(jwt.verifyRefreshToken).mockReturnValue({ sub: "1", iat: 1_000 });
    vi.mocked(repository.findUserById).mockResolvedValue(existingUser);
    vi.mocked(jwt.signAccessToken).mockReturnValue("new-access-token");

    const result = await refresh("valid-token");

    expect(result).toEqual({
      accessToken: "new-access-token",
      user: {
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
        createdAt: existingUser.createdAt,
      },
    });
  });

  it("rejects a token issued before the password was changed", async () => {
    vi.mocked(jwt.verifyRefreshToken).mockReturnValue({ sub: "1", iat: 1_000 });
    vi.mocked(repository.findUserById).mockResolvedValue({
      ...existingUser,
      passwordChangedAt: new Date(2_000 * 1000),
    });

    await expect(refresh("old-token")).rejects.toThrow(
      InvalidRefreshTokenError,
    );
  });

  it("accepts a token issued after the password was changed", async () => {
    vi.mocked(jwt.verifyRefreshToken).mockReturnValue({ sub: "1", iat: 3_000 });
    vi.mocked(repository.findUserById).mockResolvedValue({
      ...existingUser,
      passwordChangedAt: new Date(2_000 * 1000),
    });
    vi.mocked(jwt.signAccessToken).mockReturnValue("new-access-token");

    const result = await refresh("new-token");

    expect(result.accessToken).toBe("new-access-token");
  });

  it("accepts a token issued in the same second as the change", async () => {
    vi.mocked(jwt.verifyRefreshToken).mockReturnValue({ sub: "1", iat: 2_000 });
    vi.mocked(repository.findUserById).mockResolvedValue({
      ...existingUser,
      passwordChangedAt: new Date(2_000 * 1000 + 500),
    });
    vi.mocked(jwt.signAccessToken).mockReturnValue("new-access-token");

    await expect(refresh("same-second-token")).resolves.toBeDefined();
  });
});

describe("requestPasswordReset", () => {
  const now = new Date("2026-10-21T12:00:00.000Z");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    vi.mocked(sendMail).mockResolvedValue(undefined);
    vi.mocked(repository.findLatestResetTokenCreatedAt).mockResolvedValue(null);
    vi.mocked(repository.replaceResetToken).mockResolvedValue([
      { count: 0 },
      {},
    ] as never);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does nothing for an unknown email", async () => {
    vi.mocked(repository.findUserByEmail).mockResolvedValue(null);

    await requestPasswordReset("nobody@example.com");

    expect(repository.replaceResetToken).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("does nothing when a link was requested less than a minute ago", async () => {
    vi.mocked(repository.findUserByEmail).mockResolvedValue(existingUser);
    vi.mocked(repository.findLatestResetTokenCreatedAt).mockResolvedValue(
      new Date(now.getTime() - 59_000),
    );

    await requestPasswordReset("a@b.com");

    expect(repository.replaceResetToken).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("stores a hashed token that expires in 30 minutes and emails the raw one", async () => {
    vi.mocked(repository.findUserByEmail).mockResolvedValue(existingUser);
    vi.mocked(repository.findLatestResetTokenCreatedAt).mockResolvedValue(
      new Date(now.getTime() - 61_000),
    );

    await requestPasswordReset("a@b.com");

    const [stored, storedAt] = vi.mocked(repository.replaceResetToken).mock
      .calls[0]!;
    expect(stored.userId).toBe("1");
    expect(stored.expiresAt).toEqual(new Date(now.getTime() + 30 * 60 * 1000));
    expect(storedAt).toEqual(now);

    const message = vi.mocked(sendMail).mock.calls[0]![0];
    expect(message.to).toBe("a@b.com");
    const rawToken = /token=([\w-]+)/.exec(message.text)![1]!;
    expect(hashResetToken(rawToken)).toBe(stored.tokenHash);
    expect(stored.tokenHash).not.toBe(rawToken);
  });

  it("still succeeds when the email cannot be sent", async () => {
    vi.mocked(repository.findUserByEmail).mockResolvedValue(existingUser);
    vi.mocked(sendMail).mockRejectedValue(new Error("brevo down"));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(requestPasswordReset("a@b.com")).resolves.toBeUndefined();
    await vi.runAllTimersAsync();

    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });
});

describe("resetPassword", () => {
  it("rejects a token that matches nothing usable", async () => {
    vi.mocked(password.hashPassword).mockResolvedValue("new-hash");
    vi.mocked(repository.resetPasswordWithToken).mockResolvedValue(false);

    await expect(
      resetPassword({ token: "bad", password: "GoodPassword1" }),
    ).rejects.toThrow(InvalidResetTokenError);
  });

  it("looks the token up by its hash and stores the hashed password", async () => {
    vi.mocked(password.hashPassword).mockResolvedValue("new-hash");
    vi.mocked(repository.resetPasswordWithToken).mockResolvedValue(true);

    await resetPassword({ token: "raw-token", password: "GoodPassword1" });

    expect(password.hashPassword).toHaveBeenCalledWith("GoodPassword1");
    expect(repository.resetPasswordWithToken).toHaveBeenCalledWith({
      tokenHash: hashResetToken("raw-token"),
      passwordHash: "new-hash",
      now: expect.any(Date),
    });
  });

  it("answers 400 with the invalid-or-expired message", () => {
    const error = new InvalidResetTokenError();

    expect(error.statusCode).toBe(400);
    expect(error.message).toBe("This reset link is invalid or has expired.");
  });
});
