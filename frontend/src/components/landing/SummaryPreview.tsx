import { formatEuro } from "../../lib/money";
import { JobTypeBadge } from "../jobs/JobTypeBadge";
import { Card } from "../ui/Card";
import { ProgressBar } from "../ui/ProgressBar";
import {
  PREVIEW,
  PREVIEW_EARNED_LABEL,
  PREVIEW_LIMIT_LABEL,
  previewEarnedText,
  previewLimitText,
} from "./landing-content";

// A static, made-up Summary card. It is hidden from assistive tech: the
// numbers are an example, not data.
export function SummaryPreview() {
  const { period, caption, job, earned, planned, limit } = PREVIEW;

  return (
    <Card padded aria-hidden="true" className="mx-auto w-full max-w-md">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink">{period}</p>
        <span className="text-xs text-ink-muted">{caption}</span>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <p className="font-semibold text-ink">{job.name}</p>
        <JobTypeBadge type={job.type} />
      </div>
      <p className="mt-1 text-sm text-ink-muted">
        {previewEarnedText(formatEuro(earned), formatEuro(planned))}
      </p>
      <ProgressBar
        value={Number(earned)}
        max={Number(planned)}
        label={PREVIEW_EARNED_LABEL}
        className="mt-3"
      />
      <p className="mt-5 text-sm text-ink-muted">
        {previewLimitText(formatEuro(planned), formatEuro(limit))}
      </p>
      <ProgressBar
        value={Number(planned)}
        max={Number(limit)}
        label={PREVIEW_LIMIT_LABEL}
        className="mt-3"
      />
    </Card>
  );
}
