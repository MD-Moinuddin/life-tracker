import { beforeEach, describe, expect, it } from "vitest";
import { ApiError } from "../api-client";
import type { JobWithShiftCount } from "../jobs-api";
import type { Leave } from "../leave-api";
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

  it("returns the three vacation fields: the Cafe tracks 80h, a new job nothing", async () => {
    const jobs = await demoFetch<JobWithShiftCount[]>("/api/jobs");
    const created = await demoFetch<JobWithShiftCount>("/api/jobs", {
      method: "POST",
      body: { name: "Kiosk", hourlyRate: "11.5", type: "part_time" },
    });

    expect(jobs[0]).toMatchObject({
      name: "Cafe",
      vacationHoursPerYear: "80.00",
      vacationCarryOverHours: "0.00",
      vacationCarryOverYear: null,
    });
    for (const job of [jobs[1], created]) {
      expect(job).toMatchObject({
        vacationHoursPerYear: null,
        vacationCarryOverHours: "0.00",
        vacationCarryOverYear: null,
      });
    }
  });

  it("saves, returns and clears the vacation settings", async () => {
    const created = await demoFetch<JobWithShiftCount>("/api/jobs", {
      method: "POST",
      body: {
        name: "Kiosk",
        hourlyRate: "11.5",
        type: "part_time",
        vacationHoursPerYear: "80",
        vacationCarryOverHours: "8",
        vacationCarryOverYear: 2026,
      },
    });
    const off = await demoFetch<JobWithShiftCount>(`/api/jobs/${created.id}`, {
      method: "PATCH",
      body: { vacationHoursPerYear: null },
    });

    expect(created).toMatchObject({
      vacationHoursPerYear: "80.00",
      vacationCarryOverHours: "8.00",
      vacationCarryOverYear: 2026,
    });
    expect(off.vacationHoursPerYear).toBeNull();
  });

  it("refuses carry-over hours without a year", async () => {
    const error = await status(
      demoFetch("/api/jobs/demo-job-cafe", {
        method: "PATCH",
        body: { vacationCarryOverHours: "5" },
      }),
    );

    expect(error?.status).toBe(400);
    expect(error?.fields).toEqual({
      vacationCarryOverYear: [
        "Say which year the carried-over hours belong to",
      ],
    });
  });

  it("edits a job", async () => {
    const updated = await demoFetch<JobWithShiftCount>(
      "/api/jobs/demo-job-cafe",
      { method: "PATCH", body: { hourlyRate: "16.00" } },
    );

    expect(updated).toMatchObject({ name: "Cafe", hourlyRate: "16.00" });
  });

  it("deletes a job together with its shifts and its leave, like the database does", async () => {
    const before = demoDb.shifts.length;
    expect(demoDb.leave.length).toBeGreaterThan(0);
    const cafeShifts = demoDb.shifts.filter(
      (shift) => shift.jobId === "demo-job-cafe",
    ).length;

    await demoFetch("/api/jobs/demo-job-cafe", { method: "DELETE" });

    expect(demoDb.jobs.map((job) => job.id)).not.toContain("demo-job-cafe");
    expect(demoDb.shifts).toHaveLength(before - cafeShifts);
    expect(demoDb.leave).toEqual([]);
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

// The backend's leave API cases (backend/tests/integration/leave.integration.test.ts),
// replayed against the demo: the same week, the same answers.
// Monday 9 March to Friday 13 March 2026.
const workWeek = {
  startDate: "2026-03-09",
  endDate: "2026-03-13",
  weekdays: [1, 2, 3, 4, 5],
  minutesPerDay: 240,
};

type CreatedLeave = Leave & { removedShifts?: number };

function postLeave(body: object) {
  return demoFetch<CreatedLeave>("/api/leave", { method: "POST", body });
}

function patchLeave(id: string, body: object) {
  return demoFetch<Leave>(`/api/leave/${id}`, { method: "PATCH", body });
}

function listLeave(query = "") {
  return demoFetch<Leave[]>(query ? `/api/leave?${query}` : "/api/leave");
}

async function vacationJob(name = "Kiosk") {
  return demoFetch<JobWithShiftCount>("/api/jobs", {
    method: "POST",
    body: {
      name,
      hourlyRate: "12.5",
      type: "mini_job",
      vacationHoursPerYear: "80",
    },
  });
}

async function addShift(jobId: string, date: string) {
  return demoFetch<Shift>("/api/shifts", {
    method: "POST",
    body: { jobId, date, startTime: "09:00", endTime: "13:00" },
  });
}

const shiftIds = () => demoDb.shifts.map((shift) => shift.id);

describe("demo leave", () => {
  it("lists the seeded leave in start order, with its job", async () => {
    const leave = await listLeave();

    expect(leave.map((entry) => entry.startDate)).toEqual([
      "2026-08-03",
      "2026-09-14",
      "2026-12-07",
    ]);
    expect(leave[0]).toMatchObject({
      jobId: "demo-job-cafe",
      job: {
        id: "demo-job-cafe",
        name: "Cafe",
        hourlyRate: "14.00",
        type: "part_time",
      },
      type: "paid_vacation",
      weekdays: [1, 2, 3, 4, 5],
      minutesPerDay: 240,
      notes: null,
    });
  });

  it("creates a week of paid leave with the job details, without removedShifts", async () => {
    const job = await vacationJob();

    const created = await postLeave({
      jobId: job.id,
      ...workWeek,
      notes: "  Easter  ",
    });

    expect(created).toMatchObject({
      jobId: job.id,
      job: { id: job.id, name: "Kiosk", hourlyRate: "12.50", type: "mini_job" },
      type: "paid_vacation",
      ...workWeek,
      notes: "Easter",
    });
    expect(created).not.toHaveProperty("removedShifts");
    expect((await listLeave(`jobId=${job.id}`)).map((l) => l.id)).toEqual([
      created.id,
    ]);
  });

  it("refuses a job that does not track vacation, like the Restaurant, and a job that does not exist", async () => {
    const notTracked = await status(
      postLeave({ jobId: "demo-job-restaurant", ...workWeek }),
    );
    const missing = await status(postLeave({ jobId: "nope", ...workWeek }));

    expect(notTracked?.status).toBe(400);
    expect(notTracked?.fields).toEqual({
      jobId: ["Turn on paid vacation for this job first"],
    });
    expect(missing?.status).toBe(404);
    expect(missing?.message).toBe("Job not found");
  });

  it("refuses a range across two years with the backend's message", async () => {
    const error = await status(
      postLeave({
        jobId: "demo-job-cafe",
        ...workWeek,
        startDate: "2026-12-28",
        endDate: "2027-01-02",
      }),
    );

    expect(error?.status).toBe(400);
    expect(error?.fields).toEqual({
      endDate: [
        "Paid leave cannot span two calendar years. Add one entry for each year.",
      ],
    });
  });

  it("returns leave that overlaps the range, including one that only touches it", async () => {
    const job = await vacationJob();
    const leave = await postLeave({ jobId: job.id, ...workWeek });

    const ids = async (query: string) =>
      (await listLeave(`${query}&jobId=${job.id}`)).map((entry) => entry.id);

    expect(await ids("from=2026-03-01&to=2026-03-31")).toEqual([leave.id]);
    expect(await ids("from=2026-03-13&to=2026-03-20")).toEqual([leave.id]);
    expect(await ids("to=2026-03-09")).toEqual([leave.id]);
    expect(await ids("to=2026-03-08")).toEqual([]);
    expect(await ids("from=2026-04-01")).toEqual([]);
  });

  it("refuses a list query whose from date is after its to date", async () => {
    const error = await status(listLeave("from=2026-04-01&to=2026-03-01"));

    expect(error?.status).toBe(400);
    expect(error?.fields).toEqual({
      to: ["From date must not be after the to date"],
    });
  });

  it("refuses counted days that already have leave, but allows a non-counted day next to it and the same days on another job", async () => {
    const job = await vacationJob();
    await postLeave({ jobId: job.id, ...workWeek });
    const other = await vacationJob("Bar");

    const clash = await status(
      postLeave({
        jobId: job.id,
        ...workWeek,
        startDate: "2026-03-13",
        endDate: "2026-03-16",
      }),
    );
    const saturday = await postLeave({
      jobId: job.id,
      ...workWeek,
      weekdays: [6],
      endDate: "2026-03-14",
    });
    const otherJob = await postLeave({ jobId: other.id, ...workWeek });

    expect(clash?.status).toBe(400);
    expect(clash?.fields).toEqual({
      startDate: ["These days already have paid leave"],
    });
    expect(saturday.weekdays).toEqual([6]);
    expect(otherJob.jobId).toBe(other.id);
  });

  it("removes exactly the job's shifts on counted days when asked, and says how many", async () => {
    const job = await vacationJob();
    const other = await vacationJob("Bar");
    const counted = await addShift(job.id, "2026-03-10");
    const saturday = await addShift(job.id, "2026-03-14");
    const otherJobShift = await addShift(other.id, "2026-03-10");

    const created = await postLeave({
      jobId: job.id,
      ...workWeek,
      endDate: "2026-03-15",
      removeOverlappingShifts: true,
    });

    expect(created.removedShifts).toBe(1);
    expect(shiftIds()).not.toContain(counted.id);
    expect(shiftIds()).toContain(saturday.id);
    expect(shiftIds()).toContain(otherJobShift.id);
  });

  it("reports 0 removed shifts when nothing overlaps, and keeps the shifts when the option is off", async () => {
    const job = await vacationJob();
    const shift = await addShift(job.id, "2026-03-10");

    const off = await postLeave({
      jobId: job.id,
      ...workWeek,
      removeOverlappingShifts: false,
    });
    const nothing = await postLeave({
      jobId: job.id,
      ...workWeek,
      startDate: "2026-03-16",
      endDate: "2026-03-20",
      removeOverlappingShifts: true,
    });

    expect(off).not.toHaveProperty("removedShifts");
    expect(shiftIds()).toContain(shift.id);
    expect(nothing.removedShifts).toBe(0);
  });

  it("changes minutes and weekdays and re-checks overlap and the dates", async () => {
    const job = await vacationJob();
    const week = await postLeave({
      jobId: job.id,
      ...workWeek,
      weekdays: [1, 2],
    });
    const later = await postLeave({
      jobId: job.id,
      ...workWeek,
      weekdays: [4, 5],
    });

    const changed = await patchLeave(week.id, {
      minutesPerDay: 120,
      weekdays: [1, 2, 3],
    });
    const self = await patchLeave(week.id, { minutesPerDay: 300 });
    const clash = await status(patchLeave(week.id, { weekdays: [4] }));
    const noCountedDay = await status(
      patchLeave(later.id, { endDate: "2026-03-11" }),
    );

    expect(changed).toMatchObject({
      minutesPerDay: 120,
      weekdays: [1, 2, 3],
      startDate: "2026-03-09",
      endDate: "2026-03-13",
    });
    expect(self.minutesPerDay).toBe(300);
    expect(clash?.fields).toEqual({
      startDate: ["These days already have paid leave"],
    });
    expect(noCountedDay?.fields).toEqual({
      weekdays: ["None of the selected days fall between these dates"],
    });
  });

  it("refuses moving leave onto a job that does not track vacation, or that has leave on those days", async () => {
    const first = await vacationJob();
    const second = await vacationJob("Bar");
    await postLeave({ jobId: first.id, ...workWeek });
    const moving = await postLeave({ jobId: second.id, ...workWeek });

    const untracked = await status(
      patchLeave(moving.id, { jobId: "demo-job-restaurant" }),
    );
    const clash = await status(patchLeave(moving.id, { jobId: first.id }));
    const missing = await status(patchLeave(moving.id, { jobId: "nope" }));

    expect(untracked?.fields).toEqual({
      jobId: ["Turn on paid vacation for this job first"],
    });
    expect(clash?.fields).toEqual({
      startDate: ["These days already have paid leave"],
    });
    expect(missing?.status).toBe(404);
  });

  it("keeps the leave when the job stops tracking vacation, and still lists it", async () => {
    const before = await listLeave("jobId=demo-job-cafe");

    await demoFetch("/api/jobs/demo-job-cafe", {
      method: "PATCH",
      body: { vacationHoursPerYear: null },
    });

    expect(await listLeave("jobId=demo-job-cafe")).toEqual(before);
  });

  it("deletes leave once, then reports it missing", async () => {
    const [first] = await listLeave();
    const id = (first as Leave).id;

    await demoFetch(`/api/leave/${id}`, { method: "DELETE" });
    const again = await status(
      demoFetch(`/api/leave/${id}`, { method: "DELETE" }),
    );
    const edit = await status(patchLeave(id, { minutesPerDay: 60 }));

    expect((await listLeave()).map((entry) => entry.id)).not.toContain(id);
    expect(again?.status).toBe(404);
    expect(again?.message).toBe("Leave not found");
    expect(edit?.status).toBe(404);
  });

  it("refuses a bad update before looking for the entry, like the backend", async () => {
    const error = await status(patchLeave("nope", {}));

    expect(error?.status).toBe(400);
    expect(error?.fields).toEqual({
      form: ["Provide at least one field to update"],
    });
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

  it("counts the seeded leave in its month, and ignores it once the job stops tracking vacation", async () => {
    const september = `/api/summary?range=month&date=2026-09-10&now=${TODAY}T12%3A00`;
    const tracked = await demoFetch<Summary>(september);

    await demoFetch("/api/jobs/demo-job-cafe", {
      method: "PATCH",
      body: { vacationHoursPerYear: null },
    });
    const untracked = await demoFetch<Summary>(september);

    // Monday 14 to Friday 18 September, 4h a day at 14.00.
    expect(tracked.totals.leave).toEqual({
      earnedMinutes: 1200,
      plannedMinutes: 1200,
      earnedAmount: "280.00",
      plannedAmount: "280.00",
    });
    expect(tracked.jobs.map((job) => job.name)).toEqual(["Cafe"]);
    expect(untracked.jobs).toEqual([]);
    expect(untracked.totals.leave.plannedMinutes).toBe(0);
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
