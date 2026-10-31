import { beforeEach, describe, expect, it } from "vitest";
import { ApiError } from "../api-client";
import type { JobWithShiftCount } from "../jobs-api";
import type { Shift, ShiftPage } from "../shifts-api";
import type { Summary } from "../summary-api";
import { buildDemoData } from "./demo-data";
import { demoDb, loadDemoDb } from "./demo-db";
import { demoFetch } from "./demo-api";

const TODAY = "2026-10-30";

beforeEach(() => {
  loadDemoDb(buildDemoData(TODAY));
});

async function status(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (error) {
    if (error instanceof ApiError) {
      return error;
    }
    throw error;
  }
  return null;
}

describe("demo jobs", () => {
  it("lists the jobs with how many shifts each has", async () => {
    const jobs = await demoFetch<JobWithShiftCount[]>("/api/jobs");

    expect(jobs.map((job) => job.name)).toEqual(["Cafe", "Restaurant"]);
    const cafe = jobs[0] as JobWithShiftCount;
    expect(cafe.shiftCount).toBe(
      demoDb.shifts.filter((shift) => shift.jobId === cafe.id).length,
    );
  });

  it("adds a job, which then shows up with no shifts", async () => {
    const created = await demoFetch<JobWithShiftCount>("/api/jobs", {
      method: "POST",
      body: { name: "Kiosk", hourlyRate: "11.5", type: "part_time" },
    });
    const jobs = await demoFetch<JobWithShiftCount[]>("/api/jobs");

    expect(created).toMatchObject({ name: "Kiosk", hourlyRate: "11.50" });
    expect(jobs.at(-1)).toMatchObject({ id: created.id, shiftCount: 0 });
  });

  it("edits a job", async () => {
    const updated = await demoFetch<JobWithShiftCount>(
      "/api/jobs/demo-job-cafe",
      { method: "PATCH", body: { hourlyRate: "16.00" } },
    );

    expect(updated).toMatchObject({ name: "Cafe", hourlyRate: "16.00" });
  });

  it("deletes a job together with its shifts, like the database does", async () => {
    const before = demoDb.shifts.length;
    const cafeShifts = demoDb.shifts.filter(
      (shift) => shift.jobId === "demo-job-cafe",
    ).length;

    await demoFetch("/api/jobs/demo-job-cafe", { method: "DELETE" });

    expect(demoDb.jobs.map((job) => job.id)).not.toContain("demo-job-cafe");
    expect(demoDb.shifts).toHaveLength(before - cafeShifts);
  });

  it("refuses a bad job with a 400 and its field messages", async () => {
    const error = await status(
      demoFetch("/api/jobs", { method: "POST", body: { name: "" } }),
    );

    expect(error?.status).toBe(400);
    expect(error?.fields.name).toEqual(["Name is required"]);
  });

  it("answers 404 for a job that does not exist", async () => {
    const error = await status(
      demoFetch("/api/jobs/nope", { method: "PATCH", body: { name: "X" } }),
    );

    expect(error?.status).toBe(404);
  });

  it("hands out copies, so a page cannot change the demo data by accident", async () => {
    const jobs = await demoFetch<JobWithShiftCount[]>("/api/jobs");
    (jobs[0] as JobWithShiftCount).name = "Changed";

    expect(demoDb.jobs[0]?.name).toBe("Cafe");
  });
});

describe("demo shifts", () => {
  it("lists shifts in date and time order, with the job and the worked time", async () => {
    const page = await demoFetch<ShiftPage>("/api/shifts");

    const keys = page.items.map((shift) => `${shift.date}${shift.startTime}`);
    expect(keys).toEqual([...keys].sort());
    expect(page.total).toBe(demoDb.shifts.length);
    const first = page.items[0] as Shift;
    expect(first.job.name).toBeDefined();
    expect(first).toMatchObject({ date: "2026-10-12", workedMinutes: 330 });
  });

  it("filters by date range and by job", async () => {
    const week = await demoFetch<ShiftPage>(
      "/api/shifts?from=2026-10-26&to=2026-11-01",
    );
    const cafe = await demoFetch<ShiftPage>("/api/shifts?jobId=demo-job-cafe");

    expect(
      week.items.every(
        (shift) => shift.date >= "2026-10-26" && shift.date <= "2026-11-01",
      ),
    ).toBe(true);
    expect(week.items.length).toBe(6);
    expect(cafe.items.every((shift) => shift.jobId === "demo-job-cafe")).toBe(
      true,
    );
  });

  it("pages with limit and offset", async () => {
    const page = await demoFetch<ShiftPage>("/api/shifts?limit=3&offset=2");

    expect(page.items).toHaveLength(3);
    expect(page).toMatchObject({ limit: 3, offset: 2 });
    expect(page.total).toBe(demoDb.shifts.length);
  });

  it("works out the end date of a shift that runs past midnight", async () => {
    const created = await demoFetch<Shift>("/api/shifts", {
      method: "POST",
      body: {
        jobId: "demo-job-cafe",
        date: "2026-10-31",
        startTime: "22:00",
        endTime: "02:00",
        breakMinutes: 0,
      },
    });

    expect(created).toMatchObject({
      endDate: "2026-11-01",
      workedMinutes: 240,
      notes: null,
    });
  });

  it("adds a shift that then counts towards its job", async () => {
    const before = (await demoFetch<JobWithShiftCount[]>("/api/jobs")).find(
      (job) => job.id === "demo-job-restaurant",
    )?.shiftCount as number;

    await demoFetch("/api/shifts", {
      method: "POST",
      body: {
        jobId: "demo-job-restaurant",
        date: "2026-10-31",
        startTime: "08:00",
        endTime: "12:00",
        breakMinutes: 0,
      },
    });
    const jobs = await demoFetch<JobWithShiftCount[]>("/api/jobs");

    expect(
      jobs.find((job) => job.id === "demo-job-restaurant")?.shiftCount,
    ).toBe(before + 1);
  });

  it("refuses a shift for a job that does not exist", async () => {
    const error = await status(
      demoFetch("/api/shifts", {
        method: "POST",
        body: {
          jobId: "nope",
          date: "2026-10-31",
          startTime: "08:00",
          endTime: "12:00",
          breakMinutes: 0,
        },
      }),
    );

    expect(error?.status).toBe(404);
  });

  it("refuses a shift with equal start and end times", async () => {
    const error = await status(
      demoFetch("/api/shifts", {
        method: "POST",
        body: {
          jobId: "demo-job-cafe",
          date: "2026-10-31",
          startTime: "08:00",
          endTime: "08:00",
          breakMinutes: 0,
        },
      }),
    );

    expect(error?.fields.endTime).toEqual([
      "End time must be different from start time",
    ]);
  });

  it("edits a shift", async () => {
    const id = demoDb.shifts[0]?.id as string;

    const updated = await demoFetch<Shift>(`/api/shifts/${id}`, {
      method: "PATCH",
      body: { endTime: "15:00", notes: "Covered for a colleague" },
    });

    expect(updated).toMatchObject({
      endTime: "15:00",
      notes: "Covered for a colleague",
    });
  });

  it("deletes a shift, and answers 404 the second time", async () => {
    const id = demoDb.shifts[0]?.id as string;

    await demoFetch(`/api/shifts/${id}`, { method: "DELETE" });
    const again = await status(
      demoFetch(`/api/shifts/${id}`, { method: "DELETE" }),
    );

    expect(demoDb.shifts.map((shift) => shift.id)).not.toContain(id);
    expect(again?.status).toBe(404);
  });
});

describe("demo summary", () => {
  it("answers for a week and a month from the same shifts", async () => {
    const query = (range: string) =>
      `/api/summary?range=${range}&date=${TODAY}&now=${TODAY}T12%3A00`;
    const week = await demoFetch<Summary>(query("week"));
    const month = await demoFetch<Summary>(query("month"));

    expect(week.from).toBe("2026-10-26");
    expect(week.miniJob).toBeUndefined();
    expect(month.from).toBe("2026-10-01");
    expect(month.miniJob?.threshold).toBe("540.00");
    expect(Number(month.totals.plannedMinutes)).toBeGreaterThanOrEqual(
      week.totals.plannedMinutes,
    );
  });

  it("changes when a shift is added", async () => {
    const query = `/api/summary?range=week&date=${TODAY}&now=${TODAY}T12%3A00`;
    const before = await demoFetch<Summary>(query);

    await demoFetch("/api/shifts", {
      method: "POST",
      body: {
        jobId: "demo-job-restaurant",
        date: TODAY,
        startTime: "20:00",
        endTime: "22:00",
        breakMinutes: 0,
      },
    });
    const after = await demoFetch<Summary>(query);

    expect(after.totals.plannedMinutes).toBe(
      before.totals.plannedMinutes + 120,
    );
  });

  it("refuses a request without a range", async () => {
    const error = await status(demoFetch("/api/summary?date=2026-10-30"));

    expect(error?.status).toBe(400);
  });
});

describe("demoFetch", () => {
  it("answers 404 for anything the app does not use", async () => {
    expect((await status(demoFetch("/api/nothing")))?.status).toBe(404);
    expect(
      (await status(demoFetch("/api/jobs", { method: "PUT" })))?.status,
    ).toBe(404);
  });

  it("reads an id that was URL-encoded", async () => {
    const error = await status(
      demoFetch("/api/jobs/a%20b", { method: "DELETE" }),
    );

    expect(error?.status).toBe(404);
  });
});
