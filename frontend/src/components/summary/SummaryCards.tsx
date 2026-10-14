import { formatDateRange, formatDuration } from "../../lib/shift-format";
import { progressPercent } from "../../lib/progress";
import type { Summary } from "../../lib/summary-api";
import { JobTypeBadge } from "../jobs/JobTypeBadge";
import { Card } from "../ui/Card";
import { ProgressBar } from "../ui/ProgressBar";
import { SectionHeading } from "../ui/SectionHeading";
import { SUMMARY_EXPLANATION } from "./summary-copy";
import { SummaryFigures } from "./SummaryFigures";

interface SummaryCardsProps {
  summary: Summary;
}

// The summary as stacked cards, for screens too narrow for the table.
export function SummaryCards({ summary }: SummaryCardsProps) {
  const { jobs, totals } = summary;
  const percent = progressPercent(totals.earnedMinutes, totals.plannedMinutes);

  return (
    <div className="space-y-3">
      <Card padded>
        <SectionHeading>Total</SectionHeading>
        <SummaryFigures figures={totals} />
        <ProgressBar
          value={totals.earnedMinutes}
          max={totals.plannedMinutes}
          label="Planned hours finished"
          valueText={`${formatDuration(totals.earnedMinutes)} of ${formatDuration(totals.plannedMinutes)}`}
          className="mt-3"
        />
        <p className="mt-2 text-sm text-ink-muted">
          {`${percent}% of planned hours done`}
        </p>
      </Card>
      <p className="text-sm text-ink-muted">{SUMMARY_EXPLANATION}</p>
      <ul
        aria-label={`Hours and earnings per job, ${formatDateRange(summary.from, summary.to)}`}
        className="space-y-3"
      >
        {jobs.map((job) => (
          <li key={job.jobId}>
            <Card padded>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-ink">{job.name}</h3>
                <JobTypeBadge type={job.type} />
              </div>
              <SummaryFigures figures={job} />
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
