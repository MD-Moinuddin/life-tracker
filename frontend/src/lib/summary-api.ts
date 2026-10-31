import { authedFetch } from "./authed-api";
import { localNow } from "./dates";
import { NO_SUMMARY_LEAVE } from "./summary-totals";
import type { JobType } from "./jobs-api";
import type { SummaryRange } from "./summary-period";

export interface SummaryLeave {
  earnedMinutes: number;
  plannedMinutes: number;
  earnedAmount: string;
  plannedAmount: string;
}

export interface SummaryJob {
  jobId: string;
  name: string;
  type: JobType;
  hourlyRate: string;
  earnedMinutes: number;
  plannedMinutes: number;
  earnedAmount: string;
  plannedAmount: string;
  leave: SummaryLeave;
}

export interface SummaryTotals {
  earnedMinutes: number;
  plannedMinutes: number;
  earnedAmount: string;
  plannedAmount: string;
  leave: SummaryLeave;
}

export interface MiniJobSummary {
  plannedAmount: string;
  threshold: string;
  warning: boolean;
}

export interface Summary {
  from: string;
  to: string;
  jobs: SummaryJob[];
  totals: SummaryTotals;
  miniJob?: MiniJobSummary;
}

export interface SummaryParams {
  range: SummaryRange;
  date: string;
  now?: string;
}

// What a backend from before paid leave sends: no `leave` anywhere.
type MaybeWithLeave<T extends { leave: SummaryLeave }> = Omit<T, "leave"> & {
  leave?: SummaryLeave;
};

type SummaryResponse = Omit<Summary, "jobs" | "totals"> & {
  jobs: MaybeWithLeave<SummaryJob>[];
  totals: MaybeWithLeave<SummaryTotals>;
};

const withLeave = <T extends { leave?: SummaryLeave }>(figures: T) => ({
  ...figures,
  leave: figures.leave ?? NO_SUMMARY_LEAVE,
});

// A missing `leave` (an older backend during a release) counts as no leave, so
// the pages can always read it.
export async function getSummary({
  range,
  date,
  now = localNow(),
}: SummaryParams): Promise<Summary> {
  const query = new URLSearchParams({ range, date, now });
  const summary = await authedFetch<SummaryResponse>(
    `/api/summary?${query.toString()}`,
  );
  return {
    ...summary,
    jobs: summary.jobs.map(withLeave),
    totals: withLeave(summary.totals),
  };
}
