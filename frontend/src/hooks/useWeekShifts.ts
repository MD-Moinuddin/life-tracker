import { useCallback, useEffect, useRef, useState } from "react";
import { addDays, localNow, weekBounds } from "../lib/dates";
import { listShifts } from "../lib/shifts-api";
import { useLoad } from "./useLoad";

const MAX_PAGE_SIZE = 500;

// The shifts of one Monday to Sunday week, past or future. `version` is a
// counter the page bumps after it changes a shift, which fetches again.
export function useWeekShifts(version: number) {
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

  const seenVersion = useRef(version);
  useEffect(() => {
    if (seenVersion.current !== version) {
      seenVersion.current = version;
      reload();
    }
  }, [version, reload]);

  return {
    today,
    state,
    weekStart,
    weekEnd: addDays(weekStart, 6),
    previousWeek: () => setWeekStart((current) => addDays(current, -7)),
    nextWeek: () => setWeekStart((current) => addDays(current, 7)),
  };
}
