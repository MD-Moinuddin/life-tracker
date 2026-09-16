import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { prisma } from "../../src/lib/prisma";

const testEmail = `integration-${Date.now()}@example.com`;
const testPassword = "GoodPassword1";

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: testEmail } });
});

describe("auth flow", () => {
  it("signs up, logs in, refreshes, and logs out", async () => {
    const signupRes = await request(app)
      .post("/api/auth/signup")
      .send({ email: testEmail, password: testPassword });
    expect(signupRes.status).toBe(201);
    expect(signupRes.body).not.toHaveProperty("passwordHash");

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: testEmail, password: testPassword });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.accessToken).toBeTruthy();

    const loginCookie = loginRes.headers["set-cookie"];
    expect(loginCookie).toBeTruthy();

    const refreshRes = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", loginCookie!);
    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.accessToken).toBeTruthy();

    const logoutRes = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", loginCookie!);
    expect(logoutRes.status).toBe(204);

    const logoutCookie = logoutRes.headers["set-cookie"];
    expect(logoutCookie).toBeTruthy();

    const refreshAfterLogoutRes = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", logoutCookie!);
    expect(refreshAfterLogoutRes.status).toBe(401);
  });
});
