import type { SummaryRange } from "../../lib/summary-api";
import { COMPACT_BUTTON_CLASSES } from "../form/form-styles";

interface SummaryControlsProps {
  range: SummaryRange;
  label: string;
  onRangeChange: (range: SummaryRange) => void;
  onPrevious: () => void;
  onNext: () => void;
}

const RANGES: { value: SummaryRange; label: string }[] = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

function toggleClassName(pressed: boolean) {
  const base =
    "px-3 py-1.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600";
  return pressed
    ? `${base} bg-indigo-600 text-white`
    : `${base} bg-white text-slate-700 hover:bg-slate-100`;
}

export function SummaryControls({
  range,
  label,
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
        {RANGES.map(({ value, label: text }) => (
          <button
            key={value}
            type="button"
            aria-pressed={range === value}
            onClick={() => onRangeChange(value)}
            className={toggleClassName(range === value)}
          >
            {text}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrevious}
          className={COMPACT_BUTTON_CLASSES}
        >
          {`Previous ${range}`}
        </button>
        <p
          aria-live="polite"
          className="min-w-[10rem] text-center text-sm font-medium text-slate-700"
        >
          {label}
        </p>
        <button
          type="button"
          onClick={onNext}
          className={COMPACT_BUTTON_CLASSES}
        >
          {`Next ${range}`}
        </button>
      </div>
    </div>
  );
}
