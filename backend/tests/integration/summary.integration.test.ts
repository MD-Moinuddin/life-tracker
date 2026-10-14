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
      },
    ]);
    expect(res.body.totals).toEqual({
      earnedMinutes: 930,
      plannedMinutes: 1170,
      earnedAmount: "178.00",
      plannedAmount: "226.00",
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
