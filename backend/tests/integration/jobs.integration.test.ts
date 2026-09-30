import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import app from "../../src/app";
import { prisma } from "../../src/lib/prisma";
import { bearer, createTestUser, deleteTestUsers } from "./helpers";

type TestUser = Awaited<ReturnType<typeof createTestUser>>;

let alice: TestUser;
let bob: TestUser;

beforeAll(async () => {
  alice = await createTestUser("alice");
  bob = await createTestUser("bob");
});

afterAll(async () => {
  await deleteTestUsers();
});

async function createJob(token: string, name: string) {
  const res = await request(app)
    .post("/api/jobs")
    .set(bearer(token))
    .send({ name, hourlyRate: "13.5", type: "part_time" });
  expect(res.status).toBe(201);
  return res.body as { id: string; name: string; hourlyRate: string };
}

describe("authentication", () => {
  it.each([
    ["get", "/api/jobs"],
    ["post", "/api/jobs"],
    ["patch", "/api/jobs/any-id"],
    ["delete", "/api/jobs/any-id"],
  ] as const)("rejects %s %s without a token", async (method, path) => {
    const res = await request(app)[method](path);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: { message: "Unauthorized" } });
  });

  it("rejects a garbage token", async () => {
    const res = await request(app)
      .get("/api/jobs")
      .set(bearer("not-a-real-token"));

    expect(res.status).toBe(401);
  });
});

describe("create and list", () => {
  it("creates a job and sends the rate as a two-decimal string", async () => {
    const res = await request(app)
      .post("/api/jobs")
      .set(bearer(alice.token))
      .send({ name: "Warehouse", hourlyRate: "13.5", type: "part_time" });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      name: "Warehouse",
      hourlyRate: "13.50",
      type: "part_time",
    });
    expect(res.body).not.toHaveProperty("userId");
  });

  it("lists only the caller's own jobs", async () => {
    const aliceJob = await createJob(alice.token, "Alice only");

    const bobList = await request(app).get("/api/jobs").set(bearer(bob.token));
    const aliceList = await request(app)
      .get("/api/jobs")
      .set(bearer(alice.token));

    const bobIds = bobList.body.map((job: { id: string }) => job.id);
    const aliceIds = aliceList.body.map((job: { id: string }) => job.id);
    expect(bobIds).not.toContain(aliceJob.id);
    expect(aliceIds).toContain(aliceJob.id);
  });

  it("includes the number of shifts in each job", async () => {
    const job = await createJob(alice.token, "With shifts");
    await prisma.shift.createMany({
      data: [
        {
          jobId: job.id,
          date: new Date("2026-10-03"),
          startTime: "09:00",
          endTime: "17:00",
        },
        {
          jobId: job.id,
          date: new Date("2026-10-03"),
          startTime: "18:00",
          endTime: "20:00",
        },
      ],
    });

    const res = await request(app).get("/api/jobs").set(bearer(alice.token));

    const listed = res.body.find((item: { id: string }) => item.id === job.id);
    expect(listed.shiftCount).toBe(2);
  });

  it("sends Cache-Control no-store", async () => {
    const res = await request(app).get("/api/jobs").set(bearer(alice.token));

    expect(res.headers["cache-control"]).toBe("no-store");
  });
});

describe("validation", () => {
  it("rejects a bad rate and names the field", async () => {
    const res = await request(app)
      .post("/api/jobs")
      .set(bearer(alice.token))
      .send({ name: "X", hourlyRate: "-5", type: "part_time" });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe("Validation failed");
    expect(res.body.error.fields.hourlyRate.length).toBeGreaterThan(0);
  });

  it("reports a missing body under form", async () => {
    const res = await request(app).post("/api/jobs").set(bearer(alice.token));

    expect(res.status).toBe(400);
    expect(res.body.error.fields).toHaveProperty("form");
  });

  it("explains an empty update", async () => {
    const job = await createJob(alice.token, "Empty patch");

    const res = await request(app)
      .patch(`/api/jobs/${job.id}`)
      .set(bearer(alice.token))
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error.fields.form).toEqual([
      "Provide at least one field to update",
    ]);
  });

  it("turns a malformed JSON body into a 400", async () => {
    const res = await request(app)
      .post("/api/jobs")
      .set(bearer(alice.token))
      .set("Content-Type", "application/json")
      .send('{"name": broken');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: { message: "Invalid request" } });
  });
});

describe("update and delete", () => {
  it("updates the caller's own job", async () => {
    const job = await createJob(alice.token, "To update");

    const res = await request(app)
      .patch(`/api/jobs/${job.id}`)
      .set(bearer(alice.token))
      .send({ hourlyRate: "15" });

    expect(res.status).toBe(200);
    expect(res.body.hourlyRate).toBe("15.00");
  });

  it("returns 404 and changes nothing when another user edits or deletes a job", async () => {
    const job = await createJob(alice.token, "Not bob's");

    const patch = await request(app)
      .patch(`/api/jobs/${job.id}`)
      .set(bearer(bob.token))
      .send({ name: "Hacked" });
    const del = await request(app)
      .delete(`/api/jobs/${job.id}`)
      .set(bearer(bob.token));

    expect(patch.status).toBe(404);
    expect(patch.body).toEqual({ error: { message: "Job not found" } });
    expect(del.status).toBe(404);

    const stored = await prisma.job.findUnique({ where: { id: job.id } });
    expect(stored?.name).toBe("Not bob's");
  });

  it("deletes the caller's own job, then reports it gone", async () => {
    const job = await createJob(alice.token, "To delete");

    const first = await request(app)
      .delete(`/api/jobs/${job.id}`)
      .set(bearer(alice.token));
    const second = await request(app)
      .delete(`/api/jobs/${job.id}`)
      .set(bearer(alice.token));

    expect(first.status).toBe(204);
    expect(second.status).toBe(404);
  });
});
