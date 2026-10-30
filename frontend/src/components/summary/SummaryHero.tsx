import { formatEuro } from "../../lib/money";
import { progressPercent } from "../../lib/progress";
import { formatDuration } from "../../lib/shift-format";
import type { SummaryTotals } from "../../lib/summary-api";
import { Card } from "../ui/Card";
import { EYEBROW_CLASSES } from "../ui/eyebrow";
import { ProgressBar } from "../ui/ProgressBar";

interface SummaryHeroProps {
  totals: SummaryTotals;
}

function Stat({
  label,
  value,
  detail,
  accent,
  children,
}: {
  label: string;
  value: string;
  detail: string;
  accent?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Card padded className="px-6">
      <p className={EYEBROW_CLASSES}>{label}</p>
      <p
        className={`mt-1 text-4xl font-bold tracking-tight tabular-nums ${accent ? "text-accent" : "text-ink"}`}
      >
        {value}
      </p>
      <p className="text-sm text-ink-muted tabular-nums">{detail}</p>
      {children}
    </Card>
  );
}

// The three numbers to read first: what was earned, what is planned, and how
// far along the plan is.
export function SummaryHero({ totals }: SummaryHeroProps) {
  const percent = progressPercent(totals.earnedMinutes, totals.plannedMinutes);

  return (
    <section aria-label="Totals" className="mb-4 grid grid-cols-3 gap-4">
      <Stat
        label="Earned"
        value={formatEuro(totals.earnedAmount)}
        detail={`${formatDuration(totals.earnedMinutes)} finished`}
        accent
      />
      <Stat
        label="Planned"
        value={formatEuro(totals.plannedAmount)}
        detail={`${formatDuration(totals.plannedMinutes)} scheduled`}
      />
      <Stat
        label="Progress"
        value={`${percent}%`}
        detail="of planned hours done"
      >
        <ProgressBar
          value={totals.earnedMinutes}
          max={totals.plannedMinutes}
          label="Planned hours finished"
          valueText={`${formatDuration(totals.earnedMinutes)} of ${formatDuration(totals.plannedMinutes)}`}
          className="mt-3"
        />
      </Stat>
    </section>
  );
}
