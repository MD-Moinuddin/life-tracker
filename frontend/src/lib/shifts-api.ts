import { authedFetch } from "./authed-api";
import type { Job } from "./jobs-api";

export interface Shift {
  id: string;
  jobId: string;
  job: Pick<Job, "id" | "name" | "hourlyRate" | "type">;
  date: string;
  startTime: string;
  endTime: string;
  endDate: string;
  breakMinutes: number;
  workedMinutes: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftPage {
  items: Shift[];
  total: number;
  limit: number;
  offset: number;
}

export interface ShiftInput {
  jobId: string;
  date: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  notes?: string | null;
}

export interface ListShiftsParams {
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export function listShifts(params: ListShiftsParams = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      query.set(key, String(value));
    }
  }
  const queryString = query.toString();
  return authedFetch<ShiftPage>(
    queryString ? `/api/shifts?${queryString}` : "/api/shifts",
  );
}

export function createShift(input: ShiftInput) {
  return authedFetch<Shift>("/api/shifts", { method: "POST", body: input });
}

export function updateShift(id: string, input: Partial<ShiftInput>) {
  return authedFetch<Shift>(`/api/shifts/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: input,
  });
}

export function deleteShift(id: string) {
  return authedFetch<void>(`/api/shifts/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
