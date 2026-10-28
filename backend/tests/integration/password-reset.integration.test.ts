import jwt from "jsonwebtoken";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import app from "../../src/app";
import { env } from "../../src/config/env";
import { sendMail } from "../../src/lib/mail/send-mail";
import { prisma } from "../../src/lib/prisma";
import { hashResetToken } from "../../src/modules/auth/reset-token";
import { createTestUser, deleteTestUsers } from "./helpers";

vi.mock("../../src/lib/mail/send-mail", () => ({ sendMail: vi.fn() }));

const OLD_PASSWORD = "GoodPassword1";
const NEW_PASSWORD = "BrandNewPass9";
const INVALID_LINK = "This reset link is invalid or has expired.";

beforeEach(() => {
  vi.mocked(sendMail).mockReset();
  vi.mocked(sendMail).mockResolvedValue(undefined);
});

afterAll(deleteTestUsers);

function requestReset(email: string) {
  return request(app).post("/api/auth/forgot-password").send({ email });
}

function resetWith(token: string, password = NEW_PASSWORD) {
  return request(app)
    .post("/api/auth/reset-password")
    .send({ token, password });
}

function logIn(email: string, password: string) {
  return request(app).post("/api/auth/login").send({ email, password });
}

function emailedToken(): string {
  const message = vi.mocked(sendMail).mock.calls.at(-1)?.[0];
  const match = message?.text.match(/token=([\w-]+)/);
  if (!match?.[1]) {
    throw new Error("No reset email was sent");
  }
  return match[1];
}

describe("POST /api/auth/forgot-password", () => {
  it("answers the same way and sends nothing for an unknown email", async () => {
    const res = await requestReset(`nobody-${Date.now()}@example.com`);

    expect(res.status).toBe(202);
    expect(res.body.message).toBe(
      "If an account exists for that email, we've sent a link.",
    );
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("rejects something that is not an email", async () => {
    const res = await requestReset("not-an-email");

    expect(res.status).toBe(400);
  });

  it("stores only the hash of the token and emails the raw one", async () => {
    const { id, email } = await createTestUser("forgot");

    const res = await requestReset(email);

    expect(res.status).toBe(202);
    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(vi.mocked(sendMail).mock.calls[0]![0].to).toBe(email);
    const token = emailedToken();
    const stored = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashResetToken(token) },
    });
    expect(stored?.userId).toBe(id);
    expect(stored?.usedAt).toBeNull();
    expect(
      await prisma.passwordResetToken.findUnique({
        where: { tokenHash: token },
      }),
    ).toBeNull();
  });

  it("sends no second email inside the cooldown, and replaces the old link after it", async () => {
    const { id, email } = await createTestUser("cooldown");

    await requestReset(email);
    const firstToken = emailedToken();
    const second = await requestReset(email);

    expect(second.status).toBe(202);
    expect(sendMail).toHaveBeenCalledTimes(1);

    await prisma.passwordResetToken.updateMany({
      where: { userId: id },
      data: { createdAt: new Date(Date.now() - 61_000) },
    });
    await requestReset(email);

    expect(sendMail).toHaveBeenCalledTimes(2);
    expect(emailedToken()).not.toBe(firstToken);
    expect(
      await prisma.passwordResetToken.count({ where: { userId: id } }),
    ).toBe(1);
    expect((await resetWith(firstToken)).status).toBe(400);
  });
});

describe("POST /api/auth/reset-password", () => {
  it("sets the new password, ends the old one and uses up the token", async () => {
    const { id, email } = await createTestUser("reset");
    await requestReset(email);
    const token = emailedToken();

    const res = await resetWith(token);

    expect(res.status).toBe(204);
    expect((await logIn(email, NEW_PASSWORD)).status).toBe(200);
    expect((await logIn(email, OLD_PASSWORD)).status).toBe(401);
    const user = await prisma.user.findUnique({ where: { id } });
    expect(user?.passwordChangedAt).not.toBeNull();
    const stored = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashResetToken(token) },
    });
    expect(stored?.usedAt).not.toBeNull();

    const again = await resetWith(token, "AnotherPass7");
    expect(again.status).toBe(400);
    expect(again.body.error.message).toBe(INVALID_LINK);
  });

  it("rejects a token that does not exist", async () => {
    const res = await resetWith("not-a-real-token");

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe(INVALID_LINK);
  });

  it("rejects an expired token and leaves the password alone", async () => {
    const { id, email } = await createTestUser("expired");
    await requestReset(email);
    const token = emailedToken();
    await prisma.passwordResetToken.updateMany({
      where: { userId: id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const res = await resetWith(token);

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe(INVALID_LINK);
    expect((await logIn(email, OLD_PASSWORD)).status).toBe(200);
  });

  it("applies the signup password rules", async () => {
    const { email } = await createTestUser("weak");
    await requestReset(email);

    const res = await resetWith(emailedToken(), "short");

    expect(res.status).toBe(400);
    expect(res.body.error.fields.password).toContain(
      "Password must be at least 8 characters",
    );
    expect((await logIn(email, OLD_PASSWORD)).status).toBe(200);
  });
});

describe("sessions after a reset", () => {
  it("rejects an older refresh token and accepts one from a new login", async () => {
    const { id, email } = await createTestUser("sessions");
    const oldRefreshToken = jwt.sign(
      { sub: id, iat: Math.floor(Date.now() / 1000) - 120 },
      env.JWT_REFRESH_SECRET,
      { algorithm: "HS256", expiresIn: "1h" },
    );
    const refreshWith = (token: string) =>
      request(app)
        .post("/api/auth/refresh")
        .set("Cookie", `refreshToken=${token}`);
    expect((await refreshWith(oldRefreshToken)).status).toBe(200);

    await requestReset(email);
    await resetWith(emailedToken());

    expect((await refreshWith(oldRefreshToken)).status).toBe(401);
    const login = await logIn(email, NEW_PASSWORD);
    const cookie = (login.headers["set-cookie"] as unknown as string[])[0]!;
    const fresh = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", cookie);
    expect(fresh.status).toBe(200);
  });
});
