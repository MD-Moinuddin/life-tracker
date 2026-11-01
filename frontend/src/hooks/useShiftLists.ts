import { useCallback, useMemo, useState } from "react";
import { addDays, hasEnded, localNow, weekBounds } from "../lib/dates";
import type { Leave } from "../lib/leave-api";
import {
  isLeaveDayTaken,
  isLeavePlanned,
  leaveDaysIn,
} from "../lib/leave-days";
import { listShifts } from "../lib/shifts-api";
import { useTrackedLeave } from "./useLeave";
import type { TrackableJob } from "./useLeave";
import { useLoad } from "./useLoad";
import type { LoadState } from "./useLoad";

const MAX_PAGE_SIZE = 500;

// The shifts that have not ended yet, soonest first. `now` is the browser's
// wall-clock time, so the caller decides which "now" the page works with.
export function useUpcomingShifts(now: string, jobId?: string) {
  const load = useCallback(async () => {
    const page = await listShifts({
      jobId,
      from: addDays(now.slice(0, 10), -1),
      limit: MAX_PAGE_SIZE,
    });
    return page.items.filter((shift) => !hasEnded(shift, now));
  }, [jobId, now]);

  return useLoad(load);
}

// Keeps the ready leave that `keep` accepts; other states pass through.
function keepLeave(
  state: LoadState<Leave[]>,
  keep: (entry: Leave) => boolean,
): LoadState<Leave[]> {
  return state.status === "ready"
    ? { status: "ready", data: state.data.filter(keep) }
    : state;
}

// Upcoming and History, each with its paid leave. `jobs` are the loaded jobs
// (null until known): leave is only asked for when one of them tracks paid
// vacation, and only leave of such jobs (of `jobId`, if given) is returned.
export function useShiftLists(
  jobId?: string,
  jobs: readonly TrackableJob[] | null = null,
) {
  const [now] = useState(localNow);
  const today = now.slice(0, 10);
  const currentWeekStart = weekBounds(today).from;
  const [weekStart, setWeekStart] = useState(currentWeekStart);

  const loadHistory = useCallback(async () => {
    const page = await listShifts({
      jobId,
      from: weekStart,
      to: addDays(weekStart, 6),
      limit: MAX_PAGE_SIZE,
    });
    return page.items.filter((shift) => hasEnded(shift, now)).reverse();
  }, [jobId, weekStart, now]);

  const upcoming = useUpcomingShifts(now, jobId);
  const history = useLoad(loadHistory);
  const weekEnd = addDays(weekStart, 6);
  const upcomingLeave = useTrackedLeave({ from: today, jobId, jobs });
  const historyLeave = useTrackedLeave({
    from: weekStart,
    to: weekEnd,
    jobId,
    jobs,
  });
  // Upcoming: leave that ends today or later. History: leave with a counted
  // day in the week that is already past.
  const upcomingLeaveState = useMemo(
    () =>
      keepLeave(upcomingLeave.state, (entry) => isLeavePlanned(entry, today)),
    [upcomingLeave.state, today],
  );
  const historyLeaveState = useMemo(
    () =>
      keepLeave(historyLeave.state, (entry) =>
        leaveDaysIn(entry, weekStart, weekEnd).some((day) =>
          isLeaveDayTaken(day, today),
        ),
      ),
    [historyLeave.state, weekStart, weekEnd, today],
  );

  return {
    today,
    upcoming: upcoming.state,
    history: history.state,
    upcomingLeave: upcomingLeaveState,
    historyLeave: historyLeaveState,
    weekStart,
    weekEnd,
    canGoNext: weekStart < currentWeekStart,
    previousWeek: () => setWeekStart((current) => addDays(current, -7)),
    nextWeek: () => setWeekStart((current) => addDays(current, 7)),
    // Separate, so a shift change never asks for the leave again. Leave
    // changes call both: booking leave can remove shifts.
    reloadShifts: () => {
      upcoming.reload();
      history.reload();
    },
    reloadLeave: () => {
      upcomingLeave.reload();
      historyLeave.reload();
    },
  };
}

export type ShiftLists = ReturnType<typeof useShiftLists>;
