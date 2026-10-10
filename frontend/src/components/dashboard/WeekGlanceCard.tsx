import { Link } from "react-router-dom";
import type { LoadState } from "../../hooks/useLoad";
import { classNames } from "../../lib/class-names";
import { formatEuro } from "../../lib/money";
import { progressPercent } from "../../lib/progress";
import { ROUTES } from "../../lib/routes";
import { formatDateRange, formatDuration } from "../../lib/shift-format";
import type { Summary } from "../../lib/summary-api";
import { LoadBoundary } from "../LoadBoundary";
import { Card } from "../ui/Card";
import { LINK_CLASSES } from "../ui/links";

interface WeekGlanceCardProps {
  state: LoadState<Summary>;
}

function WeekContent({ summary }: { summary: Summary }) {
  const { totals } = summary;

  if (summary.jobs.length === 0) {
    return (
      <p className="text-sm text-ink-muted">
        No shifts this week yet.{" "}
        <Link to={ROUTES.shifts} className={LINK_CLASSES}>
          Add a shift
        </Link>
      </p>
    );
  }

  const percent = progressPercent(totals.earnedMinutes, totals.plannedMinutes);

  return (
    <>
      <p className="text-sm text-ink-muted">
        {formatDateRange(summary.from, summary.to)}
      </p>
      <p className="mt-3 text-title font-bold tracking-tight text-ink">
        {formatEuro(totals.plannedAmount)}
      </p>
      <p className="text-sm text-ink-muted">
        {`planned this week · ${formatDuration(totals.plannedMinutes)}`}
      </p>
      <div
        role="progressbar"
        aria-label="Hours worked so far"
        aria-valuemin={0}
        aria-valuemax={totals.plannedMinutes}
        aria-valuenow={totals.earnedMinutes}
        aria-valuetext={`${formatDuration(totals.earnedMinutes)} of ${formatDuration(totals.plannedMinutes)}`}
        className="mt-3 h-2 rounded-full bg-neutral-soft"
      >
        <div
          className="h-2 rounded-full bg-accent"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-2 text-sm text-ink-muted">
        {`${formatEuro(totals.earnedAmount)} earned so far · ${formatDuration(totals.earnedMinutes)}`}
      </p>
      <Link
        to={ROUTES.summary}
        className={classNames(
          LINK_CLASSES,
          "mt-3 inline-flex min-h-11 items-center text-sm",
        )}
      >
        View summary
      </Link>
    </>
  );
}

export function WeekGlanceCard({ state }: WeekGlanceCardProps) {
  return (
    <Card padded>
      <h2 className="mb-1 text-section font-semibold text-ink">
        Week at a glance
      </h2>
      <LoadBoundary state={state} noun="your week">
        {(summary) => <WeekContent summary={summary} />}
      </LoadBoundary>
    </Card>
  );
}
