import type { SummaryJob } from "./summary-api";

// Each job's share of the period's earnings, in whole percent. Plain rounding
// can add up to 99 or 101, so the leftover points go to the largest
// remainders and the shares always add up to 100 (or all 0 with no earnings).
export function earningsShares(jobs: readonly SummaryJob[]): number[] {
  const amounts = jobs.map((job) => Number(job.earnedAmount));
  const total = amounts.reduce((sum, amount) => sum + amount, 0);
  if (total <= 0) {
    return amounts.map(() => 0);
  }

  const exact = amounts.map((amount) => (amount / total) * 100);
  const shares = exact.map(Math.floor);
  const leftover = 100 - shares.reduce((sum, share) => sum + share, 0);
  exact
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index)
    .slice(0, leftover)
    .forEach(({ index }) => {
      shares[index] = (shares[index] ?? 0) + 1;
    });
  return shares;
}
