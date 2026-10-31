import { addDays, weekBounds } from "../dates";
import type { DemoJob, DemoShift } from "./demo-db";

// The ids are fixed so each demo job keeps the same colour (see jobColor), and
// these two map to two different colours.
const JOB_IDS = {
  cafe: "demo-job-cafe",
  restaurant: "demo-job-restaurant",
} as const;

type JobKey = keyof typeof JOB_IDS;

const JOBS: {
  key: JobKey;
  name: string;
  hourlyRate: string;
  type: DemoJob["type"];
}[] = [
  { key: "cafe", name: "Cafe", hourlyRate: "14.00", type: "part_time" },
  {
    key: "restaurant",
    name: "Restaurant",
    hourlyRate: "15.00",
    type: "mini_job",
  },
];

interface WeeklyShift {
  // 0 is Monday, 6 is Sunday.
  weekday: number;
  job: JobKey;
  start: string;
  end: string;
  breakMinutes?: number;
  notes?: string;
}

// The demo story: one ordinary working week that repeats. A part-time job at a
// cafe in the mornings and early afternoons, and a mini-job at a restaurant on
// Friday and Saturday evenings, about 8.5 hours a week, so a month sits just
// under the mini-job limit. No two shifts overlap, there is a night between a
// late finish and the next start, and one shift runs past midnight.
// Change the story here and nowhere else.
const WEEK: WeeklyShift[] = [
  {
    weekday: 0,
    job: "cafe",
    start: "08:00",
    end: "14:00",
    breakMinutes: 30,
    notes: "Opening shift",
  },
  { weekday: 1, job: "cafe", start: "08:00", end: "14:00", breakMinutes: 30 },
  { weekday: 3, job: "cafe", start: "12:00", end: "18:00", breakMinutes: 30 },
  { weekday: 5, job: "cafe", start: "09:00", end: "15:00", breakMinutes: 30 },
  { weekday: 4, job: "restaurant", start: "18:00", end: "22:00" },
  {
    weekday: 5,
    job: "restaurant",
    start: "20:00",
    end: "00:30",
    notes: "Closing shift",
  },
];

// How many weeks the demo covers around the current one, so a week or a month
// of the Summary always has a full set of shifts.
const WEEKS_BEFORE = 2;
const WEEKS_AFTER = 2;

// The jobs and shifts of the demo, repeating the working week around `today`
// (YYYY-MM-DD): finished shifts behind it, upcoming ones ahead.
export function buildDemoData(today: string): {
  jobs: DemoJob[];
  shifts: DemoShift[];
} {
  const stamp = `${today}T00:00:00.000Z`;
  const jobs = JOBS.map(({ key, ...job }) => ({
    id: JOB_IDS[key],
    ...job,
    createdAt: stamp,
    updatedAt: stamp,
  }));

  const firstMonday = addDays(weekBounds(today).from, -7 * WEEKS_BEFORE);
  const shifts: DemoShift[] = [];
  for (let week = 0; week <= WEEKS_BEFORE + WEEKS_AFTER; week += 1) {
    for (const planned of WEEK) {
      shifts.push({
        id: `demo-shift-seed-${shifts.length + 1}`,
        jobId: JOB_IDS[planned.job],
        date: addDays(firstMonday, week * 7 + planned.weekday),
        startTime: planned.start,
        endTime: planned.end,
        breakMinutes: planned.breakMinutes ?? 0,
        notes: planned.notes ?? null,
        createdAt: stamp,
        updatedAt: stamp,
      });
    }
  }
  return { jobs, shifts };
}
