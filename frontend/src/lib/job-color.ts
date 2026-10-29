// Tailwind only generates classes it can read in the source, so every class is
// written out in full. The colours are the --color-job-* tokens.
export const JOB_COLORS = [
  { edge: "border-job-1", dot: "bg-job-1" },
  { edge: "border-job-2", dot: "bg-job-2" },
  { edge: "border-job-3", dot: "bg-job-3" },
  { edge: "border-job-4", dot: "bg-job-4" },
  { edge: "border-job-5", dot: "bg-job-5" },
  { edge: "border-job-6", dot: "bg-job-6" },
] as const;

// The same job always gets the same colour, on every page and every visit,
// without storing anything.
export function jobColor(jobId: string) {
  let hash = 0;
  for (const char of jobId) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return JOB_COLORS[hash % JOB_COLORS.length] ?? JOB_COLORS[0];
}
