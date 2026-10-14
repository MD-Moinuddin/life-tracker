import request from "supertest";
import app from "../../src/app";
import { prisma } from "../../src/lib/prisma";

const password = "GoodPassword1";
const createdEmails: string[] = [];

export async function createTestUser(label: string) {
  const email = `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  createdEmails.push(email);

  await request(app)
    .post("/api/auth/signup")
    .send({ name: `Test ${label}`, email, password })
    .expect(201);
  const login = await request(app)
    .post("/api/auth/login")
    .send({ email, password })
    .expect(200);

  return {
    id: login.body.user.id as string,
    token: login.body.accessToken as string,
  };
}

export function bearer(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function deleteTestUsers() {
  await prisma.user.deleteMany({ where: { email: { in: createdEmails } } });
  createdEmails.length = 0;
}
