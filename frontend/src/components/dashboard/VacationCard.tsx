import type { JobWithShiftCount } from "../../lib/jobs-api";
import type { Leave } from "../../lib/leave-api";
import {
  formatDuration,
  formatLeavePeriod,
  formatSignedDuration,
} from "../../lib/shift-format";
import type { VacationBalance } from "../../lib/vacation";
import { PLANNED_STYLE } from "../leave/planned-style";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { EYEBROW_CLASSES } from "../ui/eyebrow";
import { Icon } from "../ui/Icon";
import { Skeleton } from "../ui/Skeleton";

export interface VacationRow {
  job: JobWithShiftCount;
  balance: VacationBalance;
  // The earliest leave that has not ended yet.
  next?: Leave;
}

interface VacationCardProps {
  rows: VacationRow[];
  onAddLeave: () => void;
}

function totalMinutes(balance: VacationBalance) {
  return balance.entitlementMinutes + balance.carriedOverMinutes;
}

function nextText(next: Leave | undefined) {
  return next
    ? `Next: ${formatLeavePeriod(next.startDate, next.endDate)}`
    : "Nothing planned";
}

// Taken and planned leave against the allowance. It never grows past its box,
// and its label carries every figure in words.
function VacationBar({ balance }: { balance: VacationBalance }) {
  const total = totalMinutes(balance);
  const isOver = balance.leftMinutes < 0;
  const scale = Math.max(total, balance.takenMinutes + balance.plannedMinutes);
  const share = (minutes: number) => (scale > 0 ? (minutes / scale) * 100 : 0);
  const label = `${formatDuration(balance.takenMinutes)} taken, ${formatDuration(balance.plannedMinutes)} planned, ${
    isOver
      ? `over by ${formatDuration(-balance.leftMinutes)}`
      : `${formatDuration(balance.leftMinutes)} left`
  } of ${formatDuration(total)}`;

  return (
    <div
      role="img"
      aria-label={label}
      className="mt-3 flex h-2 overflow-hidden rounded-full bg-neutral-soft"
    >
      <div
        data-segment="taken"
        className="h-full bg-leave"
        style={{ width: `${share(balance.takenMinutes)}%` }}
      />
      <div
        data-segment="planned"
        className="h-full"
        style={{
          ...PLANNED_STYLE,
          width: `${share(balance.plannedMinutes)}%`,
        }}
      />
    </div>
  );
}

function OverBy({ minutes }: { minutes: number }) {
  return (
    <span className="inline-flex items-center gap-1 font-semibold text-warning-ink">
      <Icon name="warning" className="h-4 w-4 shrink-0" />
      {`over by ${formatDuration(minutes)}`}
    </span>
  );
}

function SingleJob({ row }: { row: VacationRow }) {
  const { balance } = row;
  const isOver = balance.leftMinutes < 0;

  return (
    <>
      <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">
        <span>{formatSignedDuration(balance.leftMinutes)}</span>{" "}
        <small className="text-[15px] font-medium text-ink-muted">
          {`left of ${formatDuration(totalMinutes(balance))}`}
        </small>
      </p>
      <VacationBar balance={balance} />
      <p className="mt-1 text-sm text-ink-muted">{nextText(row.next)}</p>
      {isOver && (
        <p className="mt-1 text-sm">
          <OverBy minutes={-balance.leftMinutes} />
        </p>
      )}
    </>
  );
}

function JobRows({ rows }: { rows: VacationRow[] }) {
  return (
    <ul aria-label="Paid vacation by job" className="mt-3 space-y-4">
      {rows.map((row) => {
        const { balance } = row;
        return (
          <li key={row.job.id}>
            <p className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
              <span className="font-semibold">{row.job.name}</span>
              {balance.leftMinutes < 0 ? (
                <OverBy minutes={-balance.leftMinutes} />
              ) : (
                <span className="text-ink-muted tabular-nums">
                  {`${formatDuration(balance.leftMinutes)} left of ${formatDuration(totalMinutes(balance))}`}
                </span>
              )}
            </p>
            <VacationBar balance={balance} />
            <p className="mt-1 text-sm text-ink-muted">{nextText(row.next)}</p>
          </li>
        );
      })}
    </ul>
  );
}

export function VacationCardSkeleton() {
  return (
    <Card padded role="status" aria-busy="true" className="px-6">
      <span className="sr-only">Loading your paid vacation…</span>
      <div className="space-y-3" aria-hidden="true">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-9 w-2/5" />
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-11 w-36" />
      </div>
    </Card>
  );
}

// The Dashboard's view of the paid vacation: what is left this year, per job
// that tracks it, and the next planned leave.
export function VacationCard({ rows, onAddLeave }: VacationCardProps) {
  const [only] = rows;
  return (
    <Card role="region" aria-label="Paid vacation" padded className="px-6">
      <h2 className={`${EYEBROW_CLASSES} flex items-center gap-1.5`}>
        <Icon name="sun" className="h-4 w-4 shrink-0 text-leave" />
        {rows.length === 1 && only
          ? `Paid vacation · ${only.job.name}`
          : "Paid vacation"}
      </h2>
      {rows.length === 1 && only ? (
        <SingleJob row={only} />
      ) : (
        <JobRows rows={rows} />
      )}
      <Button variant="secondary" className="mt-4" onClick={onAddLeave}>
        Add paid leave
      </Button>
    </Card>
  );
}
