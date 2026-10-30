import { jobColor } from "../../lib/job-color";
import type { SummaryJob } from "../../lib/summary-api";
import { earningsShares } from "../../lib/summary-share";
import { Card } from "../ui/Card";
import { EYEBROW_CLASSES } from "../ui/eyebrow";

interface EarningsShareProps {
  jobs: readonly SummaryJob[];
}

// One bar split by job colour, showing where the period's earnings came from.
// Nothing to show until something has been earned.
export function EarningsShare({ jobs }: EarningsShareProps) {
  const shares = earningsShares(jobs);
  if (shares.every((share) => share === 0)) {
    return null;
  }

  const description = jobs
    .map((job, index) => `${job.name} ${shares[index]}%`)
    .join(", ");

  return (
    <Card padded className="mb-3 px-4 sm:mb-4 sm:px-6">
      <h2 className={EYEBROW_CLASSES}>Where your earnings come from</h2>
      <div
        role="img"
        aria-label={`Share of earnings: ${description}`}
        className="my-3 flex h-3.5 gap-0.5 overflow-hidden rounded-full bg-neutral-soft"
      >
        {jobs.map((job, index) => (
          <span
            key={job.jobId}
            className={jobColor(job.jobId).dot}
            style={{ width: `${shares[index]}%` }}
          />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink">
        {jobs.map((job, index) => (
          <li key={job.jobId} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className={`h-2.5 w-2.5 rounded-sm ${jobColor(job.jobId).dot}`}
            />
            {job.name}
            <span className="font-semibold tabular-nums">{`${shares[index]}%`}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
