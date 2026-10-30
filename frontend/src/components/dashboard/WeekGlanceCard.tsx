import { Link } from "react-router-dom";
import type { LoadState } from "../../hooks/useLoad";
import { formatEuro } from "../../lib/money";
import { progressPercent } from "../../lib/progress";
import { ROUTES } from "../../lib/routes";
import { formatDateRange, formatDuration } from "../../lib/shift-format";
import type { Summary } from "../../lib/summary-api";
import { LoadBoundary } from "../LoadBoundary";
import { buttonClassName } from "../ui/Button";
import { Card } from "../ui/Card";
import { EYEBROW_CLASSES } from "../ui/eyebrow";
import { LINK_CLASSES } from "../ui/links";
import { ProgressBar } from "../ui/ProgressBar";
import { Skeleton } from "../ui/Skeleton";

interface WeekGlanceCardProps {
  state: LoadState<Summary>;
}

function WeekSkeleton() {
  return (
    <div role="status" aria-busy="true" className="mt-3 space-y-3">
      <span className="sr-only">Loading your week…</span>
      <Skeleton className="h-10 w-2/5" />
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-2 w-full" />
      <Skeleton className="h-11 w-36" />
    </div>
  );
}

function WeekContent({ summary }: { summary: Summary }) {
  const { totals } = summary;
  const percent = progressPercent(totals.earnedMinutes, totals.plannedMinutes);

  if (summary.jobs.length === 0) {
    return (
      <p className="mt-3 text-sm text-ink-muted">
        No shifts this week yet.{" "}
        <Link to={ROUTES.shifts} className={LINK_CLASSES}>
          Add a shift
        </Link>
      </p>
    );
  }

  return (
    <>
      <p className="mt-2 text-4xl font-bold tracking-tight text-accent tabular-nums">
        {formatEuro(totals.earnedAmount)}
      </p>
      <p className="text-sm text-ink-muted tabular-nums">
        {`earned · ${formatDuration(totals.earnedMinutes)} finished`}
      </p>
      <ProgressBar
        value={totals.earnedMinutes}
        max={totals.plannedMinutes}
        label="Planned hours finished"
        valueText={`${formatDuration(totals.earnedMinutes)} of ${formatDuration(totals.plannedMinutes)}`}
        className="mt-4"
      />
      <p className="mt-2 flex justify-between gap-3 text-sm text-ink-muted tabular-nums">
        <span>
          <span className="font-semibold text-ink">{`${percent}%`}</span>
          {" of planned hours done"}
        </span>
        <span>
          {`${formatEuro(totals.plannedAmount)} · ${formatDuration(totals.plannedMinutes)}`}
        </span>
      </p>
      <Link
        to={ROUTES.summary}
        className={buttonClassName("secondary", "normal", "mt-4")}
      >
        View summary
      </Link>
    </>
  );
}

// This week's earnings first, then how far along the plan is. It matches the
// headline figures of the Summary page.
export function WeekGlanceCard({ state }: WeekGlanceCardProps) {
  return (
    <Card padded className="px-6">
      <h2 className={EYEBROW_CLASSES}>Week at a glance</h2>
      {state.status === "ready" && (
        <p className="mt-0.5 text-sm text-ink-muted">
          {formatDateRange(state.data.from, state.data.to)}
        </p>
      )}
      <LoadBoundary state={state} noun="your week" loading={<WeekSkeleton />}>
        {(summary) => <WeekContent summary={summary} />}
      </LoadBoundary>
    </Card>
  );
}
