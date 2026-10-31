import { useCallback, useMemo } from "react";
import { listLeave } from "../lib/leave-api";
import type { Leave } from "../lib/leave-api";
import { leaveOfTrackedJobs, tracksVacation } from "../lib/vacation";
import { useLoad } from "./useLoad";
import type { LoadState } from "./useLoad";

const NO_LEAVE: Leave[] = [];
const READY_EMPTY: LoadState<Leave[]> = { status: "ready", data: NO_LEAVE };

// All the paid leave of one calendar year, for every job. With `enabled` false
// (no job tracks vacation, say) it asks for nothing and is ready with no leave.
// A failed request is reported as an error; the caller decides how to degrade.
export function useLeaveYear(year: number, enabled = true) {
  const load = useCallback(
    () =>
      enabled
        ? listLeave({ from: `${year}-01-01`, to: `${year}-12-31` })
        : Promise.resolve(NO_LEAVE),
    [year, enabled],
  );
  const { state, reload } = useLoad(load);

  return { state: enabled ? state : READY_EMPTY, reload };
}

// The calendar years in which one job has leave, in order, from a request
// without a date range. Null until known, and when the request fails (the
// caller then offers no choice of year).
export function useJobLeaveYears(jobId: string) {
  const load = useCallback(() => listLeave({ jobId }), [jobId]);
  const { state, reload } = useLoad(load);
  if (state.status !== "ready") {
    return { years: null, reload };
  }
  const years = new Set<number>();
  for (const entry of state.data) {
    if (entry.jobId !== jobId) continue;
    const last = Number(entry.endDate.slice(0, 4));
    for (let year = Number(entry.startDate.slice(0, 4)); year <= last; year++) {
      years.add(year);
    }
  }
  return { years: [...years].sort((a, b) => a - b), reload };
}

// A job as far as leave is concerned: which job, and whether it tracks paid
// vacation.
export interface TrackableJob {
  id: string;
  vacationHoursPerYear?: string | null;
}

interface TrackedLeaveOptions {
  from: string;
  to?: string;
  // Only this job's leave.
  jobId?: string;
  // The loaded jobs; null while they are not known yet.
  jobs: readonly TrackableJob[] | null;
}

// The leave overlapping [from, to] of the jobs that track paid vacation now
// (or of `jobId` alone). Asks for nothing until the jobs are known, nor when
// none of them tracks vacation. A failed request counts as no leave, so the
// shifts it is shown with never break.
export function useTrackedLeave({
  from,
  to,
  jobId,
  jobs,
}: TrackedLeaveOptions) {
  const enabled =
    jobs !== null &&
    jobs.some(
      (job) => tracksVacation(job) && (jobId === undefined || job.id === jobId),
    );
  const load = useCallback(
    () =>
      enabled
        ? listLeave({
            from,
            ...(to === undefined ? {} : { to }),
            ...(jobId === undefined ? {} : { jobId }),
          })
        : Promise.resolve(NO_LEAVE),
    [enabled, from, to, jobId],
  );
  const { state: loaded, reload } = useLoad(load);

  const state = useMemo((): LoadState<Leave[]> => {
    if (!enabled || loaded.status === "error") return READY_EMPTY;
    if (loaded.status === "loading") return loaded;
    const tracked = leaveOfTrackedJobs(loaded.data, jobs ?? []);
    return {
      status: "ready",
      data: jobId ? tracked.filter((entry) => entry.jobId === jobId) : tracked,
    };
  }, [enabled, loaded, jobs, jobId]);

  return { state, reload };
}
