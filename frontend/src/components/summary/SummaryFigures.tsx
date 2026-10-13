import { formatEuro } from "../../lib/money";
import { formatDuration } from "../../lib/shift-format";
import type { SummaryTotals } from "../../lib/summary-api";

interface SummaryFiguresProps {
  figures: SummaryTotals;
}

function FigureRow({
  label,
  minutes,
  amount,
}: {
  label: string;
  minutes: number;
  amount: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className="tabular-nums text-ink">
        {formatDuration(minutes)}{" "}
        <span className="font-medium">{formatEuro(amount)}</span>
      </dd>
    </div>
  );
}

// Earned and planned hours with their euros, for the totals card and each job card.
export function SummaryFigures({ figures }: SummaryFiguresProps) {
  return (
    <dl className="mt-3 space-y-1">
      <FigureRow
        label="Earned"
        minutes={figures.earnedMinutes}
        amount={figures.earnedAmount}
      />
      <FigureRow
        label="Planned"
        minutes={figures.plannedMinutes}
        amount={figures.plannedAmount}
      />
    </dl>
  );
}
