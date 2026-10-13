import { formatEuro } from "../../lib/money";
import type { Summary } from "../../lib/summary-api";
import { Card } from "../ui/Card";
import { ProgressBar } from "../ui/ProgressBar";
import { SectionHeading } from "../ui/SectionHeading";

interface MiniJobLimitProps {
  summary: Summary;
}

// How close the month's planned mini-job earnings are to the monthly limit.
// Shown only for a month that has a mini-job; the API decides `warning`.
export function MiniJobLimit({ summary }: MiniJobLimitProps) {
  const { miniJob } = summary;
  if (!miniJob || !summary.jobs.some((job) => job.type === "mini_job")) {
    return null;
  }

  const planned = formatEuro(miniJob.plannedAmount);
  const limit = formatEuro(miniJob.threshold);

  return (
    <Card padded className="mb-4">
      <SectionHeading>Mini-job limit</SectionHeading>
      <p className="mt-1 text-sm text-ink-muted">
        {`${planned} of ${limit} planned`}
        {miniJob.warning && (
          <span className="font-semibold text-ink">{" · Over the limit"}</span>
        )}
      </p>
      <ProgressBar
        value={Number(miniJob.plannedAmount)}
        max={Number(miniJob.threshold)}
        label="Planned mini-job earnings against the monthly limit"
        valueText={`${planned} of ${limit}`}
        tone={miniJob.warning ? "warning" : "accent"}
        className="mt-3"
      />
    </Card>
  );
}
