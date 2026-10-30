import { classNames } from "../../lib/class-names";
import { rangeLabel, SUMMARY_RANGES } from "../../lib/summary-period";
import type { SummaryRange } from "../../lib/summary-period";
import { PeriodNavigator } from "../PeriodNavigator";
import { Button } from "../ui/Button";
import { SegmentedControl } from "../ui/SegmentedControl";
import { SUMMARY_LAYOUTS } from "./summary-layout";
import type { SummaryLayout } from "./summary-layout";

interface SummaryControlsProps {
  range: SummaryRange;
  periodLabel: string;
  layout: SummaryLayout;
  isCurrentPeriod: boolean;
  onRangeChange: (range: SummaryRange) => void;
  onLayoutChange: (layout: SummaryLayout) => void;
  onPrevious: () => void;
  onNext: () => void;
  onCurrent: () => void;
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
  layout,
  isCurrentPeriod,
  onRangeChange,
  onLayoutChange,
  onPrevious,
  onNext,
  onCurrent,
}: SummaryControlsProps) {
  return (
    <div
      className={classNames(
        "mb-4 flex flex-wrap items-center gap-3 max-sm:mb-1",
        STICKY_ON_PHONE,
      )}
    >
      <SegmentedControl
        label="Summary period"
        options={RANGE_OPTIONS}
        value={range}
        onChange={onRangeChange}
      />
      {/* On a phone the jump sits beside the period switch and the navigator
          takes the row below; from sm up they form one group on the right. */}
      <div className="max-sm:contents sm:ml-auto sm:flex sm:items-center sm:gap-3">
        {!isCurrentPeriod && (
          <Button
            variant="secondary"
            size="compact"
            onClick={onCurrent}
            className="max-sm:ml-auto"
          >{`This ${range}`}</Button>
        )}
        <PeriodNavigator
          label={periodLabel}
          unit={range}
          className="max-sm:w-full sm:gap-3"
          onPrevious={onPrevious}
          onNext={onNext}
        />
        {/* One layout on a phone, so the choice is for wider screens. */}
        <div className="max-sm:hidden">
          <SegmentedControl
            label="Layout"
            options={SUMMARY_LAYOUTS}
            value={layout}
            onChange={onLayoutChange}
          />
        </div>
      </div>
    </div>
  );
}
