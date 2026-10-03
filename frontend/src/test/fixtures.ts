import type { Shift } from "../lib/shifts-api";

export function makeShift(overrides: Partial<Shift> = {}): Shift {
  const date = overrides.date ?? "2026-10-03";
  return {
    id: "shift-1",
    jobId: "job-1",
    job: {
      id: "job-1",
      name: "Warehouse",
      hourlyRate: "12.00",
      type: "part_time",
    },
    date,
    startTime: "09:00",
    endTime: "17:00",
    endDate: date,
    breakMinutes: 0,
    workedMinutes: 480,
    notes: null,
    createdAt: "2026-10-01T09:00:00.000Z",
    updatedAt: "2026-10-01T09:00:00.000Z",
    ...overrides,
  };
}
