import type { JobType } from "../jobs-api";

export interface DemoJob {
  id: string;
  name: string;
  hourlyRate: string;
  type: JobType;
  createdAt: string;
  updatedAt: string;
}

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

// The demo's whole "database": plain arrays in memory. Nothing is saved, so a
// reload or leaving the demo starts over from the seed.
export const demoDb = {
  jobs: [] as DemoJob[],
  shifts: [] as DemoShift[],
  counter: 0,
};

export function nextDemoId(prefix: string): string {
  demoDb.counter += 1;
  return `${prefix}-${demoDb.counter}`;
}

export function loadDemoDb(data: { jobs: DemoJob[]; shifts: DemoShift[] }) {
  demoDb.jobs = data.jobs;
  demoDb.shifts = data.shifts;
  demoDb.counter = 0;
}
