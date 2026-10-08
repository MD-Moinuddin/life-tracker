import { useCallback, useState } from "react";
import { localNow, stepPeriod, weekBounds } from "../lib/dates";
import { formatMonth, formatWeekRange } from "../lib/shift-format";
import { getSummary } from "../lib/summary-api";
import type { SummaryRange } from "../lib/summary-api";
import { useLoad } from "./useLoad";

export function useSummary() {
  const [now] = useState(localNow);
  const [range, setRange] = useState<SummaryRange>("week");
  const [date, setDate] = useState(now.slice(0, 10));

  const load = useCallback(
    () => getSummary({ range, date, now }),
    [range, date, now],
  );
  const { state } = useLoad(load);

  const { from, to } = weekBounds(date);
  const label =
    range === "week" ? formatWeekRange(from, to) : formatMonth(date);

  return {
    state,
    range,
    label,
    setRange,
    previous: () => setDate((current) => stepPeriod(range, current, -1)),
    next: () => setDate((current) => stepPeriod(range, current, 1)),
  };
}

export type SummaryView = ReturnType<typeof useSummary>;
