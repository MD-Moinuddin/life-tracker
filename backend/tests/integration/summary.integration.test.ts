import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import app from "../../src/app";
import type { JobType } from "../../src/generated/prisma/enums";
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

function createJob(name: string, hourlyRate: string, type: JobType) {
  return prisma.job.create({
    data: { userId: alice.id, name, hourlyRate, type },
  });
}

function addShifts(
  jobId: string,
  shifts: {
    date: string;
    startTime: string;
    endTime: string;
    breakMinutes?: number;
  }[],
) {
  return prisma.shift.createMany({
    data: shifts.map((shift) => ({
      jobId,
      ...shift,
      date: new Date(`${shift.date}T00:00:00Z`),
    })),
  });
}

function getSummary(token: string, query: string) {
  return request(app).get(`/api/summary?${query}`).set(bearer(token));
}

const noLeave = {
  earnedMinutes: 0,
  plannedMinutes: 0,
  earnedAmount: "0.00",
  plannedAmount: "0.00",
};

describe("authentication and validation", () => {
  it("rejects a request without a token", async () => {
    const res = await request(app).get(
      "/api/summary?range=month&date=2026-10-15&now=2026-10-15T12:00",
    );

    expect(res.status).toBe(401);
  });

  it.each([
    ["range=year&date=2026-10-15&now=2026-10-15T12:00", "range"],
    ["date=2026-10-15&now=2026-10-15T12:00", "range"],
    ["range=month&date=2026-02-30&now=2026-10-15T12:00", "date"],
    ["range=month&date=2026-10-15&now=2026-10-15", "now"],
    ["range=month&date=2026-10-15&now=2026-10-15T12:00Z", "now"],
  ])("rejects the query %s", async (query, field) => {
    const res = await getSummary(alice.token, query);

    expect(res.status).toBe(400);
    expect(res.body.error.fields).toHaveProperty(field);
  });
});

describe("a worked example in October 2026", () => {
  const now = "now=2026-10-15T12:00";

  beforeAll(async () => {
    const warehouse = await createJob("Warehouse", "12.00", "part_time");
    const cafe = await createJob("Cafe", "10.00", "mini_job");
    await addShifts(warehouse.id, [
      {
        date: "2026-10-05",
        startTime: "09:00",
        endTime: "17:00",
        breakMinutes: 30,
      },
      { date: "2026-10-06", startTime: "22:00", endTime: "02:00" },
      { date: "2026-10-20", startTime: "09:00", endTime: "13:00" },
    ]);
    await addShifts(cafe.id, [
      { date: "2026-10-10", startTime: "10:00", endTime: "14:00" },
    ]);
  });

  it("adds up earned and planned per job for the month", async () => {
    const res = await getSummary(
      alice.token,
      `range=month&date=2026-10-15&${now}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ from: "2026-10-01", to: "2026-10-31" });
    expect(res.body.jobs).toEqual([
      {
        jobId: expect.any(String),
        name: "Cafe",
        type: "mini_job",
        hourlyRate: "10.00",
        earnedMinutes: 240,
        plannedMinutes: 240,
        earnedAmount: "40.00",
        plannedAmount: "40.00",
        leave: noLeave,
      },
      {
        jobId: expect.any(String),
        name: "Warehouse",
        type: "part_time",
        hourlyRate: "12.00",
        earnedMinutes: 690,
        plannedMinutes: 930,
        earnedAmount: "138.00",
        plannedAmount: "186.00",
        leave: noLeave,
      },
    ]);
    expect(res.body.totals).toEqual({
      earnedMinutes: 930,
      plannedMinutes: 1170,
      earnedAmount: "178.00",
      plannedAmount: "226.00",
      leave: noLeave,
    });
    expect(res.body.miniJob).toEqual({
      plannedAmount: "40.00",
      threshold: "540.00",
      warning: false,
    });
  });

  it("covers only the Monday to Sunday week and has no mini-job block", async () => {
    const res = await getSummary(
      alice.token,
      `range=week&date=2026-10-07&${now}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ from: "2026-10-05", to: "2026-10-11" });
    expect(res.body.totals).toEqual({
      earnedMinutes: 930,
      plannedMinutes: 930,
      earnedAmount: "178.00",
      plannedAmount: "178.00",
      leave: noLeave,
    });
    expect(res.body).not.toHaveProperty("miniJob");
  });

  it("does not include another user's shifts", async () => {
    const res = await getSummary(
      bob.token,
      `range=month&date=2026-10-15&${now}`,
    );

    expect(res.status).toBe(200);
    expect(res.body.jobs).toEqual([]);
    expect(res.body.totals.plannedAmount).toBe("0.00");
  });
});

describe("the mini-job warning", () => {
  it("warns once planned mini-job earnings pass 540, even before anything is earned", async () => {
    const cafe = await createJob("Warning cafe", "10.00", "mini_job");
    await addShifts(cafe.id, [
      { date: "2032-01-01", startTime: "00:00", endTime: "18:00" },
      { date: "2032-01-02", startTime: "00:00", endTime: "18:00" },
      { date: "2032-01-03", startTime: "00:00", endTime: "18:00" },
    ]);
    const query = "range=month&date=2032-01-15&now=2032-01-31T23:59";

    const atLimit = await getSummary(alice.token, query);
    await addShifts(cafe.id, [
      { date: "2032-01-04", startTime: "20:00", endTime: "20:01" },
    ]);
    const above = await getSummary(alice.token, query);
    const beforeAnythingIsEarned = await getSummary(
      alice.token,
      "range=month&date=2032-01-15&now=2032-01-01T00:00",
    );

    expect(atLimit.body.miniJob).toEqual({
      plannedAmount: "540.00",
      threshold: "540.00",
      warning: false,
    });
    expect(above.body.miniJob).toEqual({
      plannedAmount: "540.17",
      threshold: "540.00",
      warning: true,
    });
    expect(beforeAnythingIsEarned.body.totals.earnedMinutes).toBe(0);
    expect(beforeAnythingIsEarned.body.miniJob.warning).toBe(true);
  });
});

describe("a shift that crosses a month end", () => {
  it("counts in the month it starts, and is earned once it ends", async () => {
    const job = await createJob("Night job", "15.00", "part_time");
    await addShifts(job.id, [
      { date: "2032-02-29", startTime: "22:00", endTime: "02:00" },
    ]);

    const beforeItEnds = await getSummary(
      alice.token,
      "range=month&date=2032-02-10&now=2032-03-01T01:00",
    );
    const afterItEnds = await getSummary(
      alice.token,
      "range=month&date=2032-02-10&now=2032-03-01T02:00",
    );
    const march = await getSummary(
      alice.token,
      "range=month&date=2032-03-10&now=2032-03-01T02:00",
    );

    expect(beforeItEnds.body.jobs[0]).toMatchObject({
      plannedMinutes: 240,
      earnedMinutes: 0,
    });
    expect(afterItEnds.body.jobs[0]).toMatchObject({
      plannedMinutes: 240,
      earnedMinutes: 240,
      plannedAmount: "60.00",
      earnedAmount: "60.00",
    });
    expect(march.body.jobs).toEqual([]);
  });
});

// Paid leave goes through the API, so it is validated like a real booking.
async function createVacationJob(
  token: string,
  name: string,
  hourlyRate: string,
  type: JobType,
) {
  const res = await request(app)
    .post("/api/jobs")
    .set(bearer(token))
    .send({ name, hourlyRate, type, vacationHoursPerYear: "200" });
  expect(res.status).toBe(201);
  return res.body as { id: string };
}

async function addLeave(
  token: string,
  jobId: string,
  leave: {
    startDate: string;
    endDate: string;
    weekdays: number[];
    minutesPerDay: number;
  },
) {
  const res = await request(app)
    .post("/api/leave")
    .set(bearer(token))
    .send({ jobId, ...leave });
  expect(res.status).toBe(201);
}

// Monday 26 to Friday 30 October 2026, 4 hours a day.
const lastWeekOfOctober = {
  startDate: "2026-10-26",
  endDate: "2026-10-30",
  weekdays: [1, 2, 3, 4, 5],
  minutesPerDay: 240,
};

describe("paid leave", () => {
  const week = "range=week&date=2026-10-28&now=2026-10-28T12:00";

  it("counts leave days before today as earned and the rest as planned", async () => {
    const user = await createTestUser("leave-week");
    const job = await createVacationJob(user.token, "Cafe", "14", "part_time");
    await addShifts(job.id, [
      { date: "2026-10-27", startTime: "09:00", endTime: "13:00" },
      { date: "2026-10-31", startTime: "10:00", endTime: "14:00" },
    ]);
    const before = await getSummary(user.token, week);

    await addLeave(user.token, job.id, lastWeekOfOctober);
    const res = await getSummary(user.token, week);

    expect(res.status).toBe(200);
    const expectedLeave = {
      earnedMinutes: 480,
      plannedMinutes: 1200,
      earnedAmount: "112.00",
      plannedAmount: "280.00",
    };
    expect(res.body.jobs).toEqual([
      {
        jobId: job.id,
        name: "Cafe",
        type: "part_time",
        hourlyRate: "14.00",
        earnedMinutes: 240,
        plannedMinutes: 480,
        earnedAmount: "56.00",
        plannedAmount: "112.00",
        leave: expectedLeave,
      },
    ]);
    expect(res.body.totals).toEqual({
      earnedMinutes: 240,
      plannedMinutes: 480,
      earnedAmount: "56.00",
      plannedAmount: "112.00",
      leave: expectedLeave,
    });
    expect(before.body.jobs[0].leave).toEqual(noLeave);
    expect({ ...res.body.jobs[0], leave: noLeave }).toEqual(
      before.body.jobs[0],
    );
    expect({ ...res.body.totals, leave: noLeave }).toEqual(before.body.totals);
  });

  it("gives a job with leave but no shifts a row, in name order", async () => {
    const user = await createTestUser("leave-only");
    const archive = await createVacationJob(
      user.token,
      "Archive",
      "10",
      "part_time",
    );
    const bakery = await createVacationJob(
      user.token,
      "Bakery",
      "12.5",
      "mini_job",
    );
    const cafe = await createVacationJob(user.token, "Cafe", "10", "part_time");
    await addShifts(archive.id, [
      { date: "2026-10-26", startTime: "09:00", endTime: "10:00" },
    ]);
    await addShifts(cafe.id, [
      { date: "2026-10-26", startTime: "09:00", endTime: "11:00" },
    ]);
    await addLeave(user.token, bakery.id, {
      ...lastWeekOfOctober,
      weekdays: [5],
    });

    const res = await getSummary(user.token, week);

    expect(res.body.jobs.map((row: { name: string }) => row.name)).toEqual([
      "Archive",
      "Bakery",
      "Cafe",
    ]);
    expect(res.body.jobs[1]).toEqual({
      jobId: bakery.id,
      name: "Bakery",
      type: "mini_job",
      hourlyRate: "12.50",
      earnedMinutes: 0,
      plannedMinutes: 0,
      earnedAmount: "0.00",
      plannedAmount: "0.00",
      leave: {
        earnedMinutes: 0,
        plannedMinutes: 240,
        earnedAmount: "0.00",
        plannedAmount: "50.00",
      },
    });
    expect(res.body.totals.leave).toEqual({
      earnedMinutes: 0,
      plannedMinutes: 240,
      earnedAmount: "0.00",
      plannedAmount: "50.00",
    });
  });

  it("counts only the days inside the month for leave that crosses a month end", async () => {
    const user = await createTestUser("leave-month-end");
    const job = await createVacationJob(user.token, "Cafe", "14", "part_time");
    // Thursday 29 October to Tuesday 3 November.
    await addLeave(user.token, job.id, {
      ...lastWeekOfOctober,
      startDate: "2026-10-29",
      endDate: "2026-11-03",
    });

    const november = await getSummary(
      user.token,
      "range=month&date=2026-11-10&now=2026-11-03T08:00",
    );
    const october = await getSummary(
      user.token,
      "range=month&date=2026-10-10&now=2026-11-03T08:00",
    );

    expect(november.body.jobs[0].leave).toEqual({
      earnedMinutes: 240,
      plannedMinutes: 480,
      earnedAmount: "56.00",
      plannedAmount: "112.00",
    });
    expect(october.body.jobs[0].leave).toEqual({
      earnedMinutes: 480,
      plannedMinutes: 480,
      earnedAmount: "112.00",
      plannedAmount: "112.00",
    });
  });

  it("adds a mini-job's planned leave to the mini-job limit, but not a part-time job's", async () => {
    const user = await createTestUser("leave-mini-job");
    const cafe = await createVacationJob(user.token, "Cafe", "10", "mini_job");
    const warehouse = await createVacationJob(
      user.token,
      "Warehouse",
      "12",
      "part_time",
    );
    await addShifts(cafe.id, [
      { date: "2026-12-01", startTime: "00:00", endTime: "18:00" },
      { date: "2026-12-02", startTime: "00:00", endTime: "18:00" },
      { date: "2026-12-03", startTime: "00:00", endTime: "18:00" },
    ]);
    const december = "range=month&date=2026-12-15&now=2026-12-01T00:00";
    // Monday 14 to Friday 18 December, 8 hours a day: 480.00 of leave.
    await addLeave(user.token, warehouse.id, {
      startDate: "2026-12-14",
      endDate: "2026-12-18",
      weekdays: [1, 2, 3, 4, 5],
      minutesPerDay: 480,
    });
    const partTimeLeaveOnly = await getSummary(user.token, december);

    // Monday 7 December, one hour: 10.00 of leave.
    await addLeave(user.token, cafe.id, {
      startDate: "2026-12-07",
      endDate: "2026-12-07",
      weekdays: [1],
      minutesPerDay: 60,
    });
    const withMiniJobLeave = await getSummary(user.token, december);

    expect(partTimeLeaveOnly.body.miniJob).toEqual({
      plannedAmount: "540.00",
      threshold: "540.00",
      warning: false,
    });
    expect(withMiniJobLeave.body.miniJob).toEqual({
      plannedAmount: "550.00",
      threshold: "540.00",
      warning: true,
    });
    expect(withMiniJobLeave.body.totals).toMatchObject({
      plannedAmount: "540.00",
      leave: { plannedMinutes: 2460, plannedAmount: "490.00" },
    });
  });

  it("leaves out the mini-job block for a week with leave", async () => {
    const user = await createTestUser("leave-mini-job-week");
    const cafe = await createVacationJob(user.token, "Cafe", "10", "mini_job");
    await addLeave(user.token, cafe.id, lastWeekOfOctober);

    const res = await getSummary(user.token, week);

    expect(res.body.totals.leave.plannedAmount).toBe("200.00");
    expect(res.body).not.toHaveProperty("miniJob");
  });

  it("returns zero leave for a period without leave", async () => {
    const user = await createTestUser("leave-none");
    const job = await createVacationJob(user.token, "Cafe", "14", "part_time");
    await addLeave(user.token, job.id, lastWeekOfOctober);
    await addShifts(job.id, [
      { date: "2026-11-09", startTime: "09:00", endTime: "13:00" },
    ]);

    const res = await getSummary(
      user.token,
      "range=week&date=2026-11-10&now=2026-11-10T12:00",
    );

    expect(res.body.jobs[0].leave).toEqual(noLeave);
    expect(res.body.totals.leave).toEqual(noLeave);
  });

  it("ignores the leave of a job that no longer tracks vacation", async () => {
    const user = await createTestUser("leave-untracked");
    const job = await createVacationJob(user.token, "Cafe", "14", "part_time");
    await addLeave(user.token, job.id, lastWeekOfOctober);
    await request(app)
      .patch(`/api/jobs/${job.id}`)
      .set(bearer(user.token))
      .send({ vacationHoursPerYear: null })
      .expect(200);

    const res = await getSummary(user.token, week);

    expect(res.body.jobs).toEqual([]);
    expect(res.body.totals.leave).toEqual(noLeave);
  });

  it("does not include another user's leave", async () => {
    const user = await createTestUser("leave-owner");
    const job = await createVacationJob(user.token, "Cafe", "14", "part_time");
    await addLeave(user.token, job.id, lastWeekOfOctober);

    const res = await getSummary(bob.token, week);

    expect(res.body.jobs).toEqual([]);
    expect(res.body.totals.leave).toEqual(noLeave);
  });
});
