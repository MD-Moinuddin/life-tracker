import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import app from "../../src/app";
import { prisma } from "../../src/lib/prisma";
import { bearer, createTestUser, deleteTestUsers } from "./helpers";

type TestUser = Awaited<ReturnType<typeof createTestUser>>;

interface LeaveBody {
  id: string;
  jobId: string;
  job: { id: string; name: string; hourlyRate: string; type: string };
  type: string;
  startDate: string;
  endDate: string;
  weekdays: number[];
  minutesPerDay: number;
  notes: string | null;
  removedShifts?: number;
}

// Monday 9 March to Friday 13 March 2026.
const workWeek = {
  startDate: "2026-03-09",
  endDate: "2026-03-13",
  weekdays: [1, 2, 3, 4, 5],
  minutesPerDay: 240,
};

let alice: TestUser;
let bob: TestUser;

async function createJob(token: string, body: object = {}) {
  const res = await request(app)
    .post("/api/jobs")
    .set(bearer(token))
    .send({ name: "Cafe", hourlyRate: "12.5", type: "mini_job", ...body });
  expect(res.status).toBe(201);
  return res.body as { id: string; name: string };
}

function createVacationJob(token: string) {
  return createJob(token, { vacationHoursPerYear: "80" });
}

function postLeave(token: string, body: object) {
  return request(app).post("/api/leave").set(bearer(token)).send(body);
}

async function createLeave(token: string, jobId: string, body: object = {}) {
  const res = await postLeave(token, { jobId, ...workWeek, ...body });
  expect(res.status).toBe(201);
  return res.body as LeaveBody;
}

function listLeave(token: string, query: string) {
  return request(app).get(`/api/leave?${query}`).set(bearer(token));
}

function patchLeave(token: string, id: string, body: object) {
  return request(app).patch(`/api/leave/${id}`).set(bearer(token)).send(body);
}

function deleteLeave(token: string, id: string) {
  return request(app).delete(`/api/leave/${id}`).set(bearer(token));
}

async function createShift(token: string, jobId: string, date: string) {
  const res = await request(app)
    .post("/api/shifts")
    .set(bearer(token))
    .send({ jobId, date, startTime: "09:00", endTime: "13:00" });
  expect(res.status).toBe(201);
  return res.body as { id: string };
}

async function shiftExists(id: string) {
  return (await prisma.shift.findUnique({ where: { id } })) !== null;
}

beforeAll(async () => {
  alice = await createTestUser("alice");
  bob = await createTestUser("bob");
});

afterAll(async () => {
  await deleteTestUsers();
});

describe("authentication", () => {
  it.each([
    ["get", "/api/leave"],
    ["post", "/api/leave"],
    ["patch", "/api/leave/any-id"],
    ["delete", "/api/leave/any-id"],
  ] as const)("rejects %s %s without a token", async (method, path) => {
    const res = await request(app)[method](path);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: { message: "Unauthorized" } });
  });
});

describe("create", () => {
  it("creates a week of paid leave with the job details", async () => {
    const job = await createVacationJob(alice.token);

    const res = await postLeave(alice.token, {
      jobId: job.id,
      ...workWeek,
      notes: "  Easter  ",
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      jobId: job.id,
      job: { id: job.id, name: "Cafe", hourlyRate: "12.50", type: "mini_job" },
      type: "paid_vacation",
      startDate: "2026-03-09",
      endDate: "2026-03-13",
      weekdays: [1, 2, 3, 4, 5],
      minutesPerDay: 240,
      notes: "Easter",
    });
    expect(res.body).not.toHaveProperty("removedShifts");
  });

  it("answers 400, not 500, for a date that is not a date", async () => {
    const job = await createVacationJob(alice.token);

    const res = await request(app)
      .post("/api/leave")
      .set(bearer(alice.token))
      .send({
        jobId: job.id,
        startDate: "1",
        endDate: "1",
        weekdays: [1, 2, 3, 4, 5],
        minutesPerDay: 240,
      });

    expect(res.status).toBe(400);
    expect(res.body.error.fields.startDate).toBeDefined();
  });

  it("refuses a job that does not track vacation, and another user's job", async () => {
    const untracked = await createJob(alice.token);
    const bobsJob = await createVacationJob(bob.token);

    const notTracked = await postLeave(alice.token, {
      jobId: untracked.id,
      ...workWeek,
    });
    const foreign = await postLeave(alice.token, {
      jobId: bobsJob.id,
      ...workWeek,
    });

    expect(notTracked.status).toBe(400);
    expect(notTracked.body.error.fields).toEqual({
      jobId: ["Turn on paid vacation for this job first"],
    });
    expect(foreign.status).toBe(404);
    expect(foreign.body).toEqual({ error: { message: "Job not found" } });
  });

  it("refuses a range across two years, an end before the start, and no counted day", async () => {
    const job = await createVacationJob(alice.token);

    const acrossYears = await postLeave(alice.token, {
      jobId: job.id,
      ...workWeek,
      startDate: "2026-12-28",
      endDate: "2027-01-02",
    });
    const backwards = await postLeave(alice.token, {
      jobId: job.id,
      ...workWeek,
      startDate: "2026-03-13",
      endDate: "2026-03-09",
    });
    const noCountedDay = await postLeave(alice.token, {
      jobId: job.id,
      ...workWeek,
      startDate: "2026-03-14",
      endDate: "2026-03-15",
    });

    expect(acrossYears.status).toBe(400);
    expect(acrossYears.body.error.fields).toEqual({
      endDate: [
        "Paid leave cannot span two calendar years. Add one entry for each year.",
      ],
    });
    expect(backwards.status).toBe(400);
    expect(backwards.body.error.fields).toEqual({
      endDate: ["End date must not be before the start date"],
    });
    expect(noCountedDay.status).toBe(400);
    expect(noCountedDay.body.error.fields).toEqual({
      weekdays: ["None of the selected days fall between these dates"],
    });
  });
});

describe("list", () => {
  it("returns leave that overlaps the range and filters by job", async () => {
    const user = await createTestUser("lister");
    const job = await createVacationJob(user.token);
    const other = await createVacationJob(user.token);
    const leave = await createLeave(user.token, job.id);
    const otherLeave = await createLeave(user.token, other.id);

    const march = await listLeave(user.token, "from=2026-03-01&to=2026-03-31");
    const overlap = await listLeave(
      user.token,
      "from=2026-03-13&to=2026-03-20",
    );
    const april = await listLeave(user.token, "from=2026-04-01");
    const byJob = await listLeave(user.token, `jobId=${job.id}`);

    expect(march.status).toBe(200);
    expect(march.body.map((l: LeaveBody) => l.id).sort()).toEqual(
      [leave.id, otherLeave.id].sort(),
    );
    expect(overlap.body.map((l: LeaveBody) => l.id).sort()).toEqual(
      [leave.id, otherLeave.id].sort(),
    );
    expect(april.body).toEqual([]);
    expect(byJob.body.map((l: LeaveBody) => l.id)).toEqual([leave.id]);
  });

  it("includes leave that only touches the range on its first day, and not the day before", async () => {
    const job = await createVacationJob(alice.token);
    const leave = await createLeave(alice.token, job.id);

    const onFirstDay = await listLeave(
      alice.token,
      `to=2026-03-09&jobId=${job.id}`,
    );
    const dayBefore = await listLeave(
      alice.token,
      `to=2026-03-08&jobId=${job.id}`,
    );

    expect(onFirstDay.body.map((l: LeaveBody) => l.id)).toEqual([leave.id]);
    expect(dayBefore.body).toEqual([]);
  });

  it("does not show another user's leave", async () => {
    const job = await createVacationJob(bob.token);
    const bobsLeave = await createLeave(bob.token, job.id);

    const res = await listLeave(alice.token, "");

    expect(res.body.map((l: LeaveBody) => l.id)).not.toContain(bobsLeave.id);
  });
});

describe("overlap with other leave", () => {
  it("refuses counted days that already have leave, but allows a non-counted day next to it and editing itself", async () => {
    const job = await createVacationJob(alice.token);
    const week = await createLeave(alice.token, job.id);

    const clash = await postLeave(alice.token, {
      jobId: job.id,
      ...workWeek,
      startDate: "2026-03-13",
      endDate: "2026-03-16",
    });
    // Same range, but only Saturday counts: no counted day is shared.
    const saturday = await postLeave(alice.token, {
      jobId: job.id,
      ...workWeek,
      weekdays: [6],
      endDate: "2026-03-14",
    });
    const selfEdit = await patchLeave(alice.token, week.id, {
      minutesPerDay: 300,
    });
    const otherJob = await createVacationJob(alice.token);
    const sameDaysOtherJob = await postLeave(alice.token, {
      jobId: otherJob.id,
      ...workWeek,
    });

    expect(clash.status).toBe(400);
    expect(clash.body.error.fields).toEqual({
      startDate: ["These days already have paid leave"],
    });
    expect(saturday.status).toBe(201);
    expect(selfEdit.status).toBe(200);
    expect(selfEdit.body.minutesPerDay).toBe(300);
    expect(sameDaysOtherJob.status).toBe(201);
  });
});

describe("overlap with shifts", () => {
  it("removes exactly the job's shifts on counted days when asked", async () => {
    const job = await createVacationJob(alice.token);
    const otherJob = await createVacationJob(alice.token);
    const countedShift = await createShift(alice.token, job.id, "2026-03-10");
    const saturdayShift = await createShift(alice.token, job.id, "2026-03-14");
    const otherJobShift = await createShift(
      alice.token,
      otherJob.id,
      "2026-03-10",
    );

    const res = await postLeave(alice.token, {
      jobId: job.id,
      ...workWeek,
      endDate: "2026-03-15",
      removeOverlappingShifts: true,
    });

    expect(res.status).toBe(201);
    expect(res.body.removedShifts).toBe(1);
    expect(await shiftExists(countedShift.id)).toBe(false);
    expect(await shiftExists(saturdayShift.id)).toBe(true);
    expect(await shiftExists(otherJobShift.id)).toBe(true);
  });

  it("reports 0 removed shifts when the option is on but nothing overlaps", async () => {
    const job = await createVacationJob(alice.token);

    const res = await postLeave(alice.token, {
      jobId: job.id,
      ...workWeek,
      removeOverlappingShifts: true,
    });

    expect(res.status).toBe(201);
    expect(res.body.removedShifts).toBe(0);
  });

  it("creates nothing and deletes nothing when removing the shifts fails", async () => {
    const job = await createVacationJob(alice.token);
    const shift = await createShift(alice.token, job.id, "2026-03-10");
    const realTransaction = prisma.$transaction.bind(prisma);
    // Make the shift deletion inside the transaction fail, and let everything
    // else in it run for real.
    vi.spyOn(prisma, "$transaction").mockImplementationOnce(((
      run: (tx: unknown) => Promise<unknown>,
    ) =>
      realTransaction((tx) =>
        run(
          new Proxy(tx, {
            get(target, property) {
              if (property === "shift") {
                return {
                  deleteMany: () => Promise.reject(new Error("boom")),
                };
              }
              return Reflect.get(target, property);
            },
          }),
        ),
      )) as never);

    const res = await postLeave(alice.token, {
      jobId: job.id,
      ...workWeek,
      removeOverlappingShifts: true,
    });

    expect(res.status).toBe(500);
    expect(await shiftExists(shift.id)).toBe(true);
    const list = await listLeave(alice.token, `jobId=${job.id}`);
    expect(list.body).toEqual([]);
  });

  it("keeps the shifts when the option is off", async () => {
    const job = await createVacationJob(alice.token);
    const shift = await createShift(alice.token, job.id, "2026-03-10");

    const off = await postLeave(alice.token, {
      jobId: job.id,
      ...workWeek,
      removeOverlappingShifts: false,
    });

    expect(off.status).toBe(201);
    expect(off.body).not.toHaveProperty("removedShifts");
    expect(await shiftExists(shift.id)).toBe(true);
  });
});

describe("update and delete", () => {
  it("changes minutes and weekdays and re-checks overlap", async () => {
    const job = await createVacationJob(alice.token);
    const week = await createLeave(alice.token, job.id, { weekdays: [1, 2] });
    const later = await createLeave(alice.token, job.id, { weekdays: [4, 5] });

    const changed = await patchLeave(alice.token, week.id, {
      minutesPerDay: 120,
      weekdays: [1, 2, 3],
    });
    const clash = await patchLeave(alice.token, week.id, { weekdays: [4] });
    const noCountedDay = await patchLeave(alice.token, later.id, {
      endDate: "2026-03-11",
    });

    expect(changed.status).toBe(200);
    expect(changed.body).toMatchObject({
      minutesPerDay: 120,
      weekdays: [1, 2, 3],
      startDate: "2026-03-09",
      endDate: "2026-03-13",
    });
    expect(clash.status).toBe(400);
    expect(clash.body.error.fields).toEqual({
      startDate: ["These days already have paid leave"],
    });
    expect(noCountedDay.status).toBe(400);
    expect(noCountedDay.body.error.fields).toEqual({
      weekdays: ["None of the selected days fall between these dates"],
    });
  });

  it("requires a new job to track vacation", async () => {
    const job = await createVacationJob(alice.token);
    const untracked = await createJob(alice.token);
    const leave = await createLeave(alice.token, job.id);

    const res = await patchLeave(alice.token, leave.id, {
      jobId: untracked.id,
    });

    expect(res.status).toBe(400);
    expect(res.body.error.fields).toEqual({
      jobId: ["Turn on paid vacation for this job first"],
    });
  });

  it("refuses moving leave onto a job that already has leave on those days", async () => {
    const first = await createVacationJob(alice.token);
    const second = await createVacationJob(alice.token);
    await createLeave(alice.token, first.id);
    const moving = await createLeave(alice.token, second.id);

    const res = await patchLeave(alice.token, moving.id, { jobId: first.id });

    expect(res.status).toBe(400);
    expect(res.body.error.fields.startDate).toEqual([
      "These days already have paid leave",
    ]);
  });

  it("refuses moving leave onto another user's job, as if it did not exist", async () => {
    const mine = await createVacationJob(alice.token);
    const theirs = await createVacationJob(bob.token);
    const leave = await createLeave(alice.token, mine.id);

    const res = await patchLeave(alice.token, leave.id, { jobId: theirs.id });

    expect(res.status).toBe(404);
  });

  it("keeps the leave when the job stops tracking vacation, and still lists it", async () => {
    const job = await createVacationJob(alice.token);
    const leave = await createLeave(alice.token, job.id);

    const off = await request(app)
      .patch(`/api/jobs/${job.id}`)
      .set(bearer(alice.token))
      .send({ vacationHoursPerYear: null });
    const list = await listLeave(alice.token, `jobId=${job.id}`);

    expect(off.status).toBe(200);
    expect(list.body.map((l: LeaveBody) => l.id)).toEqual([leave.id]);
  });

  it("deletes leave once, then reports it missing", async () => {
    const job = await createVacationJob(alice.token);
    const leave = await createLeave(alice.token, job.id);

    const first = await deleteLeave(alice.token, leave.id);
    const second = await deleteLeave(alice.token, leave.id);

    expect(first.status).toBe(204);
    expect(second.status).toBe(404);
    expect(second.body).toEqual({ error: { message: "Leave not found" } });
  });

  it("gives 404 for another user's leave on update and delete", async () => {
    const job = await createVacationJob(bob.token);
    const bobsLeave = await createLeave(bob.token, job.id);

    const patch = await patchLeave(alice.token, bobsLeave.id, {
      minutesPerDay: 60,
    });
    const del = await deleteLeave(alice.token, bobsLeave.id);

    expect(patch.status).toBe(404);
    expect(del.status).toBe(404);
    expect(
      await prisma.leave.findUnique({ where: { id: bobsLeave.id } }),
    ).not.toBeNull();
  });
});

describe("job deletion", () => {
  it("deletes the job's leave with it", async () => {
    const job = await createVacationJob(alice.token);
    const leave = await createLeave(alice.token, job.id);

    await request(app)
      .delete(`/api/jobs/${job.id}`)
      .set(bearer(alice.token))
      .expect(204);

    expect(
      await prisma.leave.findUnique({ where: { id: leave.id } }),
    ).toBeNull();
  });
});
