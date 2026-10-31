import type { SummaryLeave } from "./summary-api";

// The leave figures of a row or the totals without paid leave. The one zero
// object: the API client (for an older backend), the demo and the test
// fixtures all use it.
export const NO_SUMMARY_LEAVE: Readonly<SummaryLeave> = Object.freeze({
  earnedMinutes: 0,
  plannedMinutes: 0,
  earnedAmount: "0.00",
  plannedAmount: "0.00",
});

const toCents = (amount: string) => Math.round(Number(amount) * 100);

// Adds two money strings in whole cents, so 0.10 + 0.20 is exactly 0.30.
export const addAmounts = (a: string, b: string) =>
  ((toCents(a) + toCents(b)) / 100).toFixed(2);

// Worked pay plus paid leave, for a Summary row or its totals.
export const earnedWithLeave = (figures: {
  earnedAmount: string;
  leave: { earnedAmount: string };
}) => addAmounts(figures.earnedAmount, figures.leave.earnedAmount);

export const plannedWithLeave = (figures: {
  plannedAmount: string;
  leave: { plannedAmount: string };
}) => addAmounts(figures.plannedAmount, figures.leave.plannedAmount);

// True when a Summary row (or the totals) has paid leave planned in the
// period. Its leave figures only show then, so a row without leave looks
// exactly as it did before.
export const rowHasLeave = (figures: { leave: { plannedMinutes: number } }) =>
  figures.leave.plannedMinutes > 0;

// True when any paid leave is planned in the period, in the totals or on a job
// row.
export const hasLeave = (summary: {
  jobs: readonly { leave: { plannedMinutes: number } }[];
  totals: { leave: { plannedMinutes: number } };
}) => rowHasLeave(summary.totals) || summary.jobs.some(rowHasLeave);
