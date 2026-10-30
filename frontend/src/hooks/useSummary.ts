import { useCallback, useState } from "react";
import { localNow } from "../lib/dates";
import { getSummary } from "../lib/summary-api";
import { formatPeriod, stepPeriod } from "../lib/summary-period";
import type { SummaryRange } from "../lib/summary-period";
import { useLoad } from "./useLoad";

export function useSummary() {
  const [now] = useState(localNow);
  const [range, setRange] = useState<SummaryRange>("week");
  const today = now.slice(0, 10);
  const [date, setDate] = useState(today);

  const load = useCallback(
    () => getSummary({ range, date, now }),
    [range, date, now],
  );
  const { state, isStale, reload } = useLoad(load, { keepPreviousData: true });

  return {
    now,
    state,
    isStale,
    reload,
    range,
    periodLabel: formatPeriod(range, date),
    // Compared by label, which is unique per period, so any day of the current
    // week or month counts as the current period.
    isCurrentPeriod: formatPeriod(range, date) === formatPeriod(range, today),
    goToCurrent: () => setDate(today),
    setRange,
    previous: () => setDate((current) => stepPeriod(range, current, -1)),
    next: () => setDate((current) => stepPeriod(range, current, 1)),
  };
}

export type SummaryView = ReturnType<typeof useSummary>;
