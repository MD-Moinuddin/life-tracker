import { rangeLabel, SUMMARY_RANGES } from "../../lib/summary-period";
import type { SummaryRange } from "../../lib/summary-period";
import { PeriodNavigator } from "../PeriodNavigator";

interface SummaryControlsProps {
  range: SummaryRange;
  periodLabel: string;
  onRangeChange: (range: SummaryRange) => void;
  onPrevious: () => void;
  onNext: () => void;
}

function toggleClassName(pressed: boolean) {
  const base =
    "px-3 py-1.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600";
  return pressed
    ? `${base} bg-indigo-600 text-white`
    : `${base} bg-white text-slate-700 hover:bg-slate-100`;
}

export function SummaryControls({
  range,
  periodLabel,
  onRangeChange,
  onPrevious,
  onNext,
}: SummaryControlsProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div
        role="group"
        aria-label="Summary period"
        className="flex overflow-hidden rounded-md border border-slate-300"
      >
        {SUMMARY_RANGES.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={range === value}
            onClick={() => onRangeChange(value)}
            className={toggleClassName(range === value)}
          >
            {rangeLabel(value)}
          </button>
        ))}
      </div>
      <PeriodNavigator
        label={periodLabel}
        unit={range}
        onPrevious={onPrevious}
        onNext={onNext}
      />
    </div>
  );
}
