// A whole-number percentage for a progress bar. It works on counts such as
// minutes, never on money.
export function progressPercent(done: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round((done / total) * 100)));
}
