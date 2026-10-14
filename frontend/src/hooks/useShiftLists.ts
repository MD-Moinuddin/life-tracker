import { useCallback, useState } from "react";
import { addDays, hasEnded, localNow, weekBounds } from "../lib/dates";
import { listShifts } from "../lib/shifts-api";
import { useLoad } from "./useLoad";

const MAX_PAGE_SIZE = 500;

export function useShiftLists(jobId?: string) {
  const [now] = useState(localNow);
  const currentWeekStart = weekBounds(now.slice(0, 10)).from;
  const [weekStart, setWeekStart] = useState(currentWeekStart);

  const loadUpcoming = useCallback(async () => {
    const page = await listShifts({
      jobId,
      from: addDays(now.slice(0, 10), -1),
      limit: MAX_PAGE_SIZE,
    });
    return page.items.filter((shift) => !hasEnded(shift, now));
  }, [jobId, now]);

  const loadHistory = useCallback(async () => {
    const page = await listShifts({
      jobId,
      from: weekStart,
      to: addDays(weekStart, 6),
      limit: MAX_PAGE_SIZE,
    });
    return page.items.filter((shift) => hasEnded(shift, now)).reverse();
  }, [jobId, weekStart, now]);

  const upcoming = useLoad(loadUpcoming);
  const history = useLoad(loadHistory);

  return {
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
