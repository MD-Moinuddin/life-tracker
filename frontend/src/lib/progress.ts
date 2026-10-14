// A whole-number percentage for drawing a progress bar. Display only: money
// totals are always computed by the API, never from this.
export function progressPercent(done: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round((done / total) * 100)));
}
