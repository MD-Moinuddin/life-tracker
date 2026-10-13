import { rangeLabel, SUMMARY_RANGES } from "../../lib/summary-period";
import type { SummaryRange } from "../../lib/summary-period";
import { PeriodNavigator } from "../PeriodNavigator";
import { SegmentedControl } from "../ui/SegmentedControl";

interface SummaryControlsProps {
  range: SummaryRange;
  periodLabel: string;
  onRangeChange: (range: SummaryRange) => void;
  onPrevious: () => void;
  onNext: () => void;
}

const RANGE_OPTIONS = SUMMARY_RANGES.map((value) => ({
  value,
  label: rangeLabel(value),
}));

export function SummaryControls({
  range,
  periodLabel,
  onRangeChange,
  onPrevious,
  onNext,
}: SummaryControlsProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <SegmentedControl
        label="Summary period"
        options={RANGE_OPTIONS}
        value={range}
        onChange={onRangeChange}
      />
      <PeriodNavigator
        label={periodLabel}
        unit={range}
        className="max-sm:w-full"
        onPrevious={onPrevious}
        onNext={onNext}
      />
    </div>
  );
}
