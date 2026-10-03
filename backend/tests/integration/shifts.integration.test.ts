import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import app from "../../src/app";
import { prisma } from "../../src/lib/prisma";
import { bearer, createTestUser, deleteTestUsers } from "./helpers";

type TestUser = Awaited<ReturnType<typeof createTestUser>>;

interface ShiftBody {
  id: string;
  jobId: string;
  job: { name: string; hourlyRate: string; type: string };
  date: string;
  startTime: string;
  endTime: string;
  endDate: string;
  breakMinutes: number;
  workedMinutes: number;
  notes: string | null;
}

const dayShift = {
  date: "2026-10-03",
  startTime: "09:00",
  endTime: "17:00",
  breakMinutes: 30,
};

let alice: TestUser;
let bob: TestUser;
let aliceJobId: string;

async function createJobFor(token: string, name: string) {
  const res = await request(app)
    .post("/api/jobs")
    .set(bearer(token))
    .send({ name, hourlyRate: "12.5", type: "mini_job" });
  expect(res.status).toBe(201);
  return res.body as { id: string; name: string };
}

function postShift(token: string, body: object) {
  return request(app).post("/api/shifts").set(bearer(token)).send(body);
}

async function createShift(
  overrides: object = {},
  token = alice.token,
  jobId = aliceJobId,
) {
  const res = await postShift(token, { jobId, ...dayShift, ...overrides });
  expect(res.status).toBe(201);
  return res.body as ShiftBody;
}

function listShifts(token: string, query: string) {
  return request(app).get(`/api/shifts?${query}`).set(bearer(token));
}

beforeAll(async () => {
  alice = await createTestUser("alice");
  bob = await createTestUser("bob");
  aliceJobId = (await createJobFor(alice.token, "Warehouse")).id;
});

afterAll(async () => {
  await deleteTestUsers();
});

describe("authentication", () => {
  it.each([
    ["get", "/api/shifts"],
    ["post", "/api/shifts"],
    ["patch", "/api/shifts/any-id"],
    ["delete", "/api/shifts/any-id"],
  ] as const)("rejects %s %s without a token", async (method, path) => {
    const res = await request(app)[method](path);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: { message: "Unauthorized" } });
  });
});

describe("create", () => {
  it("creates a shift with the computed fields and the job details", async () => {
    const shift = await createShift();

    expect(shift).toMatchObject({
      date: "2026-10-03",
      startTime: "09:00",
      endTime: "17:00",
      endDate: "2026-10-03",
      breakMinutes: 30,
      workedMinutes: 450,
      job: { name: "Warehouse", hourlyRate: "12.50", type: "mini_job" },
    });
  });

  it("saves two shifts on the same day for the same job independently", async () => {
    const first = await createShift({
      date: "2031-01-10",
      startTime: "08:00",
      endTime: "12:00",
    });
    const second = await createShift({
      date: "2031-01-10",
      startTime: "18:00",
      endTime: "21:00",
    });

    const res = await listShifts(alice.token, "from=2031-01-10&to=2031-01-10");

    expect(first.id).not.toBe(second.id);
    expect(res.body.total).toBe(2);
  });

  it("saves an overnight shift, even across a month end", async () => {
    const shift = await createShift({
      date: "2031-01-31",
      startTime: "22:00",
      endTime: "02:00",
      breakMinutes: 0,
    });

    expect(shift).toMatchObject({
      date: "2031-01-31",
      endDate: "2031-02-01",
      workedMinutes: 240,
    });
  });

  it("defaults the break to 0 and stores blank notes as null", async () => {
    const res = await postShift(alice.token, {
      jobId: aliceJobId,
      date: "2026-10-04",
      startTime: "09:00",
      endTime: "10:00",
      notes: "   ",
    });

    expect(res.status).toBe(201);
    expect(res.body.breakMinutes).toBe(0);
    expect(res.body.notes).toBeNull();
  });

  it.each([
    [
      "equal start and end",
      { startTime: "08:00", endTime: "08:00" },
      "endTime",
    ],
    [
      "a break longer than the shift",
      { startTime: "09:00", endTime: "10:00", breakMinutes: 61 },
      "breakMinutes",
    ],
    ["an impossible time", { startTime: "25:00" }, "startTime"],
    ["an impossible date", { date: "2026-02-30" }, "date"],
    ["a missing job", { jobId: "" }, "jobId"],
  ] as const)(
    "rejects %s and names the field",
    async (_label, overrides, field) => {
      const res = await postShift(alice.token, {
        jobId: aliceJobId,
        ...dayShift,
        ...overrides,
      });

      expect(res.status).toBe(400);
      expect(res.body.error.fields).toHaveProperty(field);
    },
  );

  it("refuses a shift under another user's job and saves nothing", async () => {
    const before = await prisma.shift.count({ where: { jobId: aliceJobId } });

    const res = await postShift(bob.token, { jobId: aliceJobId, ...dayShift });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { message: "Job not found" } });
    expect(await prisma.shift.count({ where: { jobId: aliceJobId } })).toBe(
      before,
    );
  });

  it("refuses a job that does not exist", async () => {
    const res = await postShift(alice.token, { ...dayShift, jobId: "nope" });

    expect(res.status).toBe(404);
  });
});

describe("list", () => {
  it("returns the envelope and filters by date range, oldest first", async () => {
    await createShift({ date: "2031-02-15" });
    await createShift({ date: "2031-02-01" });
    await createShift({ date: "2031-03-01" });

    const res = await listShifts(alice.token, "from=2031-02-01&to=2031-02-28");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ total: 2, limit: 100, offset: 0 });
    expect(res.body.items.map((shift: ShiftBody) => shift.date)).toEqual([
      "2031-02-01",
      "2031-02-15",
    ]);
  });

  it("paginates without repeating or skipping shifts", async () => {
    await createShift({ date: "2031-04-01" });
    await createShift({ date: "2031-04-02" });
    await createShift({ date: "2031-04-03" });
    const range = "from=2031-04-01&to=2031-04-30";

    const page1 = await listShifts(alice.token, `${range}&limit=2&offset=0`);
    const page2 = await listShifts(alice.token, `${range}&limit=2&offset=2`);

    expect(page1.body.items).toHaveLength(2);
    expect(page2.body.items).toHaveLength(1);
    expect(page1.body.total).toBe(3);
    expect(page2.body.total).toBe(3);
    const ids = [...page1.body.items, ...page2.body.items].map(
      (shift: ShiftBody) => shift.id,
    );
    expect(new Set(ids).size).toBe(3);
  });

  it.each([
    ["limit=0", "limit"],
    ["limit=501", "limit"],
    ["offset=-1", "offset"],
    ["from=2026-02-30", "from"],
    ["from=2026-11-01&to=2026-10-01", "to"],
    ["jobId=", "jobId"],
  ])("rejects the query %s", async (query, field) => {
    const res = await listShifts(alice.token, query);

    expect(res.status).toBe(400);
    expect(res.body.error.fields).toHaveProperty(field);
  });

  it("shows a user only their own shifts", async () => {
    await createShift({ date: "2031-05-10" });
    const range = "from=2031-05-01&to=2031-05-31";

    const aliceRes = await listShifts(alice.token, range);
    const bobRes = await listShifts(bob.token, range);

    expect(aliceRes.body.total).toBe(1);
    expect(bobRes.body.total).toBe(0);
  });

  it("lists only the shifts of the job in the jobId filter", async () => {
    const other = await createJobFor(alice.token, "Other job");
    await createShift({ date: "2031-07-10" });
    await createShift({ date: "2031-07-11" }, alice.token, other.id);
    const range = "from=2031-07-01&to=2031-07-31";

    const mine = await listShifts(alice.token, `${range}&jobId=${other.id}`);
    const all = await listShifts(alice.token, range);
    const strangers = await listShifts(bob.token, `${range}&jobId=${other.id}`);

    expect(mine.body.total).toBe(1);
    expect(mine.body.items[0].job.name).toBe("Other job");
    expect(all.body.total).toBe(2);
    expect(strangers.body.total).toBe(0);
  });

  it("sends Cache-Control no-store", async () => {
    const res = await listShifts(alice.token, "");

    expect(res.headers["cache-control"]).toBe("no-store");
  });
});

describe("update", () => {
  it("changes only the sent fields and recomputes the hours", async () => {
    const shift = await createShift();

    const res = await request(app)
      .patch(`/api/shifts/${shift.id}`)
      .set(bearer(alice.token))
      .send({ startTime: "10:00" });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      startTime: "10:00",
      endTime: "17:00",
      breakMinutes: 30,
      workedMinutes: 390,
    });
  });

  it("validates against the stored values and saves nothing when invalid", async () => {
    const shift = await createShift();

    const longBreak = await request(app)
      .patch(`/api/shifts/${shift.id}`)
      .set(bearer(alice.token))
      .send({ breakMinutes: 600 });
    const equalTimes = await request(app)
      .patch(`/api/shifts/${shift.id}`)
      .set(bearer(alice.token))
      .send({ startTime: "17:00" });

    expect(longBreak.status).toBe(400);
    expect(longBreak.body.error.fields).toHaveProperty("breakMinutes");
    expect(equalTimes.status).toBe(400);
    expect(equalTimes.body.error.fields).toHaveProperty("endTime");
    const stored = await prisma.shift.findUnique({ where: { id: shift.id } });
    expect(stored).toMatchObject({ startTime: "09:00", breakMinutes: 30 });
  });

  it("accepts a break of 0 as a real value", async () => {
    const shift = await createShift();

    const res = await request(app)
      .patch(`/api/shifts/${shift.id}`)
      .set(bearer(alice.token))
      .send({ breakMinutes: 0 });

    expect(res.status).toBe(200);
    expect(res.body.workedMinutes).toBe(480);
  });

  it("clears the notes when they are blank", async () => {
    const shift = await createShift({ notes: "Early start" });

    const res = await request(app)
      .patch(`/api/shifts/${shift.id}`)
      .set(bearer(alice.token))
      .send({ notes: "" });

    expect(res.status).toBe(200);
    expect(res.body.notes).toBeNull();
  });

  it("explains an empty update", async () => {
    const shift = await createShift();

    const res = await request(app)
      .patch(`/api/shifts/${shift.id}`)
      .set(bearer(alice.token))
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error.fields.form).toEqual([
      "Provide at least one field to update",
    ]);
  });

  it("moves a shift to another job of the same user", async () => {
    const other = await createJobFor(alice.token, "Second job");
    const shift = await createShift();

    const res = await request(app)
      .patch(`/api/shifts/${shift.id}`)
      .set(bearer(alice.token))
      .send({ jobId: other.id });

    expect(res.status).toBe(200);
    expect(res.body.job.name).toBe("Second job");
  });

  it("refuses to move a shift onto another user's job", async () => {
    const bobJob = await createJobFor(bob.token, "Bob's job");
    const shift = await createShift();

    const res = await request(app)
      .patch(`/api/shifts/${shift.id}`)
      .set(bearer(alice.token))
      .send({ jobId: bobJob.id });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { message: "Job not found" } });
    const stored = await prisma.shift.findUnique({ where: { id: shift.id } });
    expect(stored?.jobId).toBe(aliceJobId);
  });

  it("returns 404 and changes nothing when another user edits a shift", async () => {
    const shift = await createShift({ notes: "Mine" });

    const res = await request(app)
      .patch(`/api/shifts/${shift.id}`)
      .set(bearer(bob.token))
      .send({ notes: "Hacked" });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { message: "Shift not found" } });
    const stored = await prisma.shift.findUnique({ where: { id: shift.id } });
    expect(stored?.notes).toBe("Mine");
  });
});

describe("delete", () => {
  it("deletes the caller's own shift, then reports it gone", async () => {
    const shift = await createShift();

    const first = await request(app)
      .delete(`/api/shifts/${shift.id}`)
      .set(bearer(alice.token));
    const second = await request(app)
      .delete(`/api/shifts/${shift.id}`)
      .set(bearer(alice.token));

    expect(first.status).toBe(204);
    expect(second.status).toBe(404);
  });

  it("returns 404 and keeps the shift when another user deletes it", async () => {
    const shift = await createShift();

    const res = await request(app)
      .delete(`/api/shifts/${shift.id}`)
      .set(bearer(bob.token));

    expect(res.status).toBe(404);
    expect(await prisma.shift.count({ where: { id: shift.id } })).toBe(1);
  });

  it("deletes a job's shifts when the job is deleted", async () => {
    const job = await createJobFor(alice.token, "Cascade job");
    await createShift({ date: "2031-06-10" }, alice.token, job.id);
    await createShift({ date: "2031-06-11" }, alice.token, job.id);
    expect(await prisma.shift.count({ where: { jobId: job.id } })).toBe(2);

    const res = await request(app)
      .delete(`/api/jobs/${job.id}`)
      .set(bearer(alice.token));

    expect(res.status).toBe(204);
    expect(await prisma.shift.count({ where: { jobId: job.id } })).toBe(0);
    const list = await listShifts(alice.token, "from=2031-06-01&to=2031-06-30");
    expect(list.body.total).toBe(0);
  });
});
