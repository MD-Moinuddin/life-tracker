import { useCallback, useState } from "react";
import { localNow } from "../lib/dates";
import { getSummary } from "../lib/summary-api";
import { formatPeriod, stepPeriod } from "../lib/summary-period";
import type { SummaryRange } from "../lib/summary-period";
import { useLoad } from "./useLoad";

export function useSummary() {
  const [now] = useState(localNow);
  const [range, setRange] = useState<SummaryRange>("week");
  const [date, setDate] = useState(now.slice(0, 10));

  const load = useCallback(
    () => getSummary({ range, date, now }),
    [range, date, now],
  );
  const { state, isStale } = useLoad(load, { keepPreviousData: true });

  return {
    state,
    isStale,
    range,
    periodLabel: formatPeriod(range, date),
    setRange,
    previous: () => setDate((current) => stepPeriod(range, current, -1)),
    next: () => setDate((current) => stepPeriod(range, current, 1)),
  };
}

export type SummaryView = ReturnType<typeof useSummary>;
