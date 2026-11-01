import { useId } from "react";
import { formatDuration, formatSignedDuration } from "../../lib/shift-format";
import type { VacationBalance } from "../../lib/vacation";
import { Alert } from "../ui/Alert";
import { cardClassName, CARD_PADDING } from "../ui/Card";
import { Icon } from "../ui/Icon";
import { PLANNED_STYLE } from "./planned-style";

const RADIUS = 62;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// How much of the ring a number of minutes covers; none without an allowance.
function arcLength(minutes: number, scale: number) {
  return scale > 0 ? (minutes / scale) * CIRCUMFERENCE : 0;
}

interface VacationBalanceCardProps {
  balance: VacationBalance;
}

export function VacationBalanceCard({ balance }: VacationBalanceCardProps) {
  const total = balance.entitlementMinutes + balance.carriedOverMinutes;
  const isOver = balance.leftMinutes < 0;
  // A year booked beyond its allowance still fits the ring.
  const scale = Math.max(total, balance.takenMinutes + balance.plannedMinutes);
  const takenLength = arcLength(balance.takenMinutes, scale);
  const plannedLength = arcLength(balance.plannedMinutes, scale);
  const patternId = useId();
  const ringLabel = isOver
    ? `Over by ${formatDuration(-balance.leftMinutes)} of ${formatDuration(total)}`
    : `${formatDuration(balance.leftMinutes)} left of ${formatDuration(total)}`;

  return (
    <section
      aria-label="Paid vacation balance"
      className={cardClassName("plain", `${CARD_PADDING} space-y-4`)}
    >
      <div
        role="img"
        aria-label={ringLabel}
        className="relative mx-auto h-[150px] w-[150px]"
      >
        <svg viewBox="0 0 150 150" className="h-[150px] w-[150px] -rotate-90">
          <defs>
            <pattern
              id={patternId}
              width="8"
              height="8"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect width="8" height="8" className="fill-leave-soft" />
              <rect width="4" height="8" className="fill-leave-edge" />
            </pattern>
          </defs>
          <circle
            cx="75"
            cy="75"
            r={RADIUS}
            fill="none"
            strokeWidth="16"
            className="stroke-neutral-soft"
          />
          <circle
            data-segment="taken"
            cx="75"
            cy="75"
            r={RADIUS}
            fill="none"
            strokeWidth="16"
            className="stroke-leave"
            strokeDasharray={`${takenLength} ${CIRCUMFERENCE}`}
          />
          <circle
            data-segment="planned"
            cx="75"
            cy="75"
            r={RADIUS}
            fill="none"
            strokeWidth="16"
            stroke={`url(#${patternId})`}
            strokeDasharray={`${plannedLength} ${CIRCUMFERENCE}`}
            strokeDashoffset={-takenLength}
          />
        </svg>
        <div
          aria-hidden="true"
          className="absolute inset-0 grid place-items-center text-center leading-tight"
        >
          <div>
            <strong className="block text-3xl tabular-nums">
              {formatSignedDuration(balance.leftMinutes)}
            </strong>
            <span className="text-xs text-ink-muted">{`left of ${formatDuration(total)}`}</span>
          </div>
        </div>
      </div>
      <dl className="grid gap-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 rounded-sm bg-leave"
            />
            Taken
          </dt>
          <dd className="font-semibold tabular-nums">
            {formatDuration(balance.takenMinutes)}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 rounded-sm border border-leave-edge"
              style={PLANNED_STYLE}
            />
            Planned
          </dt>
          <dd className="font-semibold tabular-nums">
            {formatDuration(balance.plannedMinutes)}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 rounded-sm border border-border-strong bg-neutral-soft"
            />
            Left
          </dt>
          <dd className="font-semibold tabular-nums">
            {formatSignedDuration(balance.leftMinutes)}
            <span className="ml-1 font-normal text-ink-muted">{`of ${formatDuration(total)}`}</span>
          </dd>
        </div>
      </dl>
      {isOver && (
        <Alert tone="warning">{`You are over by ${formatDuration(-balance.leftMinutes)}.`}</Alert>
      )}
      {balance.carriedOverMinutes > 0 && (
        <p className="flex items-center gap-2 rounded-control bg-leave-soft px-3 py-2 text-sm text-leave-ink">
          <Icon name="sun" className="h-4 w-4 shrink-0" />
          {`${formatDuration(balance.carriedOverMinutes)} from last year expire on 31 March.`}
        </p>
      )}
    </section>
  );
}
