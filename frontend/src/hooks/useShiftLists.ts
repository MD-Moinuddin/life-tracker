import { useCallback, useState } from "react";
import { addDays, hasEnded, localNow, weekBounds } from "../lib/dates";
import { listShifts } from "../lib/shifts-api";
import { useLoad } from "./useLoad";

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

export function useShiftLists(jobId?: string) {
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

  return {
    today,
    upcoming: upcoming.state,
    history: history.state,
    weekStart,
    weekEnd: addDays(weekStart, 6),
    canGoNext: weekStart < currentWeekStart,
    previousWeek: () => setWeekStart((current) => addDays(current, -7)),
    nextWeek: () => setWeekStart((current) => addDays(current, 7)),
    reload: () => {
      upcoming.reload();
      history.reload();
    },
  };
}

export type ShiftLists = ReturnType<typeof useShiftLists>;
