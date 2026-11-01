import { jobColor } from "../../lib/job-color";
import { formatEuro } from "../../lib/money";
import { progressPercent } from "../../lib/progress";
import { formatDateRange, formatDuration } from "../../lib/shift-format";
import type { Summary, SummaryLeave } from "../../lib/summary-api";
import { earningsShares } from "../../lib/summary-share";
import { plannedWithLeave, rowHasLeave } from "../../lib/summary-totals";
import { JobTypeBadge } from "../jobs/JobTypeBadge";
import { Card } from "../ui/Card";
import { Icon } from "../ui/Icon";
import { EYEBROW_CLASSES, EYEBROW_LEAVE_CLASSES } from "../ui/eyebrow";
import { ProgressBar } from "../ui/ProgressBar";

interface SummaryJobCardsProps {
  summary: Summary;
}

function Figure({
  label,
  amount,
  minutes,
}: {
  label: string;
  amount: string;
  minutes: number;
}) {
  return (
    <div>
      <p className={EYEBROW_CLASSES}>{label}</p>
      <p className="text-2xl font-bold text-ink tabular-nums">
        {formatEuro(amount)}
      </p>
      <p className="text-sm text-ink-muted tabular-nums">
        {formatDuration(minutes)}
      </p>
    </div>
  );
}

// The paid leave taken in the period, with the sun and the words so it never
// relies on colour. When some of it is still to come, the hours read "8h taken
// of 40h".
function LeaveBox({ leave }: { leave: SummaryLeave }) {
  const notTaken = leave.plannedMinutes > leave.earnedMinutes;
  return (
    <div
      role="group"
      aria-label="Paid leave"
      className="col-span-2 rounded-xl border border-leave-edge bg-leave-soft px-4 py-3 text-leave-ink"
    >
      <p className={`${EYEBROW_LEAVE_CLASSES} flex items-center gap-1.5`}>
        <Icon name="sun" className="h-4 w-4 shrink-0" />
        Paid leave
      </p>
      <p className="text-2xl font-bold tabular-nums">
        {formatEuro(leave.earnedAmount)}
      </p>
      <p className="text-sm tabular-nums">
        {notTaken
          ? `${formatDuration(leave.earnedMinutes)} taken of ${formatDuration(leave.plannedMinutes)}`
          : `${formatDuration(leave.earnedMinutes)} taken`}
      </p>
    </div>
  );
}

// One card per job on wide screens. The job's colour is the left edge, the
// same one its shifts have. The type badge only shows when the jobs differ.
export function SummaryJobCards({ summary }: SummaryJobCardsProps) {
  const { jobs } = summary;
  const shares = earningsShares(jobs);
  const mixedTypes = new Set(jobs.map((job) => job.type)).size > 1;

  return (
    <ul
      aria-label={`Earnings by job, ${formatDateRange(summary.from, summary.to)}`}
      className="grid gap-3 sm:grid-cols-2 sm:gap-4"
    >
      {jobs.map((job, index) => {
        const hasLeave = rowHasLeave(job);
        const percent = progressPercent(job.earnedMinutes, job.plannedMinutes);
        return (
          <li key={job.jobId}>
            <Card
              padded
              className={`h-full border-l-4 px-4 sm:px-6 ${jobColor(job.jobId).edge}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold text-ink">{job.name}</h3>
                {mixedTypes && <JobTypeBadge type={job.type} />}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-4">
                <Figure
                  label={hasLeave ? "Worked" : "Earned"}
                  amount={job.earnedAmount}
                  minutes={job.earnedMinutes}
                />
                <Figure
                  label="Planned"
                  amount={plannedWithLeave(job)}
                  minutes={job.plannedMinutes + job.leave.plannedMinutes}
                />
                {hasLeave && <LeaveBox leave={job.leave} />}
              </div>
              <ProgressBar
                value={job.earnedMinutes}
                max={job.plannedMinutes}
                label={`${job.name} planned hours finished`}
                valueText={`${formatDuration(job.earnedMinutes)} of ${formatDuration(job.plannedMinutes)}`}
                className="mt-4"
              />
              <p className="mt-2 flex flex-wrap justify-between gap-x-3 text-sm text-ink-muted">
                <span>{`${percent}% of planned hours done`}</span>
                <span>{`${shares[index]}% of your earnings`}</span>
              </p>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
