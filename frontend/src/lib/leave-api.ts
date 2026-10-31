import { authedFetch } from "./authed-api";
import type { Job } from "./jobs-api";

export interface Leave {
  id: string;
  jobId: string;
  job: Pick<Job, "id" | "name" | "hourlyRate" | "type">;
  type: "paid_vacation";
  startDate: string;
  endDate: string;
  weekdays: number[];
  minutesPerDay: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveInput {
  jobId: string;
  startDate: string;
  endDate: string;
  weekdays: number[];
  minutesPerDay: number;
  notes?: string | null;
  // Create only: delete the shifts that fall on the counted days.
  removeOverlappingShifts?: boolean;
}

export interface ListLeaveParams {
  from?: string;
  to?: string;
  jobId?: string;
}

export function listLeave(params: ListLeaveParams = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      query.set(key, value);
    }
  }
  const queryString = query.toString();
  return authedFetch<Leave[]>(
    queryString ? `/api/leave?${queryString}` : "/api/leave",
  );
}

// `removedShifts` is only present when removeOverlappingShifts was true.
export function createLeave(input: LeaveInput) {
  return authedFetch<Leave & { removedShifts?: number }>("/api/leave", {
    method: "POST",
    body: input,
  });
}

export function updateLeave(id: string, input: Partial<LeaveInput>) {
  return authedFetch<Leave>(`/api/leave/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: input,
  });
}

export function deleteLeave(id: string) {
  return authedFetch<void>(`/api/leave/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
