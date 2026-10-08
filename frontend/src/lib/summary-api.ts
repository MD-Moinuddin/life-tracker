import { authedFetch } from "./authed-api";
import { localNow } from "./dates";
import type { JobType } from "./jobs-api";

export type SummaryRange = "week" | "month";

export interface SummaryJob {
  jobId: string;
  name: string;
  type: JobType;
  hourlyRate: string;
  earnedMinutes: number;
  plannedMinutes: number;
  earnedAmount: string;
  plannedAmount: string;
}

export interface SummaryTotals {
  earnedMinutes: number;
  plannedMinutes: number;
  earnedAmount: string;
  plannedAmount: string;
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

export function getSummary({ range, date, now = localNow() }: SummaryParams) {
  const query = new URLSearchParams({ range, date, now });
  return authedFetch<Summary>(`/api/summary?${query.toString()}`);
}
