import { useCallback, useEffect, useRef, useState } from "react";
import { addDays, localNow, weekBounds } from "../lib/dates";
import { listShifts } from "../lib/shifts-api";
import { useTrackedLeave } from "./useLeave";
import type { TrackableJob } from "./useLeave";
import { useLoad } from "./useLoad";

const MAX_PAGE_SIZE = 500;

// The shifts and the paid leave of one Monday to Sunday week, past or future.
// `version` is a counter the page bumps after it changes a shift, which
// fetches the shifts again; `leaveVersion` does the same for the leave, so a
// shift change never asks for the leave. Leave is only asked for when one of
// the loaded `jobs` tracks paid vacation (see useTrackedLeave).
export function useWeekShifts(
  version: number,
  jobs: readonly TrackableJob[] | null = null,
  leaveVersion = 0,
) {
  const [today] = useState(() => localNow().slice(0, 10));
  const [weekStart, setWeekStart] = useState(() => weekBounds(today).from);

  const load = useCallback(async () => {
    const page = await listShifts({
      from: weekStart,
      to: addDays(weekStart, 6),
      limit: MAX_PAGE_SIZE,
    });
    return page.items;
  }, [weekStart]);

  const { state, reload } = useLoad(load);
  const weekEnd = addDays(weekStart, 6);
  const leave = useTrackedLeave({ from: weekStart, to: weekEnd, jobs });
  const reloadLeave = leave.reload;

  const seenVersion = useRef(version);
  useEffect(() => {
    if (seenVersion.current !== version) {
      seenVersion.current = version;
      reload();
    }
  }, [version, reload]);

  const seenLeaveVersion = useRef(leaveVersion);
  useEffect(() => {
    if (seenLeaveVersion.current !== leaveVersion) {
      seenLeaveVersion.current = leaveVersion;
      reloadLeave();
    }
  }, [leaveVersion, reloadLeave]);

  return {
    today,
    state,
    leave: leave.state,
    weekStart,
    weekEnd,
    previousWeek: () => setWeekStart((current) => addDays(current, -7)),
    nextWeek: () => setWeekStart((current) => addDays(current, 7)),
  };
}
