import type { ReactNode } from "react";
import { classNames } from "../../lib/class-names";
import { formatEuro } from "../../lib/money";
import { progressPercent } from "../../lib/progress";
import { formatDuration } from "../../lib/shift-format";
import type { SummaryTotals } from "../../lib/summary-api";
import { EYEBROW_CLASSES } from "../ui/eyebrow";
import { ProgressBar } from "../ui/ProgressBar";

interface SummaryHeroProps {
  totals: SummaryTotals;
}

// On wide screens each figure is its own card. On a phone they share one card:
// Earned leads, then the progress, then a single line for what is planned.
const SECTION =
  "mb-3 flex flex-col gap-3 rounded-card border border-border bg-surface p-5 shadow-card sm:mb-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none";
const STAT_CARD =
  "sm:rounded-card sm:border sm:border-border sm:bg-surface sm:px-6 sm:py-5 sm:shadow-card";

function Stat({
  label,
  value,
  detail,
  className,
  labelClassName,
  valueClassName,
  bodyClassName,
  children,
}: {
  label: string;
  value: string;
  detail: string;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
  bodyClassName?: string;
  children?: ReactNode;
}) {
  return (
    <div className={classNames(STAT_CARD, className)}>
      <p className={classNames(EYEBROW_CLASSES, labelClassName)}>{label}</p>
      <div className={bodyClassName}>
        <p
          className={classNames(
            "font-bold tabular-nums",
            valueClassName ?? "text-ink",
          )}
        >
          {value}
        </p>
        <p className="text-sm text-ink-muted tabular-nums">{detail}</p>
      </div>
      {children}
    </div>
  );
}

// The three numbers to read first: what was earned, how far along the plan is,
// and what is planned.
export function SummaryHero({ totals }: SummaryHeroProps) {
  const percent = progressPercent(totals.earnedMinutes, totals.plannedMinutes);

  return (
    <section aria-label="Totals" className={SECTION}>
      <Stat
        label="Earned"
        value={formatEuro(totals.earnedAmount)}
        detail={`${formatDuration(totals.earnedMinutes)} finished`}
        className="max-sm:order-1"
        valueClassName="mt-1 text-4xl tracking-tight text-accent"
      />
      <Stat
        label="Planned"
        value={formatEuro(totals.plannedAmount)}
        detail={`${formatDuration(totals.plannedMinutes)} scheduled`}
        className="max-sm:order-3 max-sm:flex max-sm:items-baseline max-sm:justify-between max-sm:gap-3 max-sm:border-t max-sm:border-border max-sm:pt-3"
        bodyClassName="max-sm:flex max-sm:items-baseline max-sm:gap-2"
        valueClassName="text-ink mt-1 sm:text-4xl sm:tracking-tight max-sm:mt-0 max-sm:text-base max-sm:font-semibold"
      />
      <Stat
        label="Progress"
        value={`${percent}%`}
        detail="of planned hours done"
        className="max-sm:order-2"
        labelClassName="max-sm:sr-only"
        bodyClassName="max-sm:flex max-sm:items-baseline max-sm:gap-1.5"
        valueClassName="text-ink mt-1 sm:text-4xl sm:tracking-tight max-sm:mt-0 max-sm:text-base max-sm:font-semibold"
      >
        <ProgressBar
          value={totals.earnedMinutes}
          max={totals.plannedMinutes}
          label="Planned hours finished"
          valueText={`${formatDuration(totals.earnedMinutes)} of ${formatDuration(totals.plannedMinutes)}`}
          className="mt-3 max-sm:mt-2"
        />
      </Stat>
    </section>
  );
}
