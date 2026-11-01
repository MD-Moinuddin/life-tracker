import type { Job } from "../jobs-api";
import type { Leave } from "../leave-api";

// A job as the backend stores it, vacation fields included.
export type DemoJob = Job;

// The vacation fields of a job that does not track paid vacation: what a new
// job has until it is told otherwise.
export const NO_VACATION: Readonly<
  Pick<
    DemoJob,
    "vacationHoursPerYear" | "vacationCarryOverHours" | "vacationCarryOverYear"
  >
> = Object.freeze({
  vacationHoursPerYear: null,
  vacationCarryOverHours: "0.00",
  vacationCarryOverYear: null,
});

export interface DemoShift {
  id: string;
  jobId: string;
  date: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// A leave entry as the backend stores it; the API adds the job.
export type DemoLeave = Omit<Leave, "job">;

// The demo's whole "database": plain arrays in memory. Nothing is saved, so a
// reload or leaving the demo starts over from the seed.
export const demoDb = {
  jobs: [] as DemoJob[],
  shifts: [] as DemoShift[],
  leave: [] as DemoLeave[],
  counter: 0,
};

export function nextDemoId(prefix: string): string {
  demoDb.counter += 1;
  return `${prefix}-${demoDb.counter}`;
}

export function loadDemoDb(data: {
  jobs: DemoJob[];
  shifts: DemoShift[];
  leave: DemoLeave[];
}) {
  demoDb.jobs = data.jobs;
  demoDb.shifts = data.shifts;
  demoDb.leave = data.leave;
  demoDb.counter = 0;
}
