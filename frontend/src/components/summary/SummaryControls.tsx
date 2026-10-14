import { classNames } from "../../lib/class-names";
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

// Phone only: pin the controls under the top edge while the cards scroll.
// Opaque and full-bleed (the page has px-4); z-10 stays under the account
// menu popover (z-20).
const STICKY_ON_PHONE =
  "max-sm:sticky max-sm:top-0 max-sm:z-10 max-sm:-mx-4 max-sm:bg-page max-sm:px-4 max-sm:py-3";

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
    <div
      className={classNames(
        "mb-4 flex flex-wrap items-center justify-between gap-3 max-sm:mb-1",
        STICKY_ON_PHONE,
      )}
    >
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
