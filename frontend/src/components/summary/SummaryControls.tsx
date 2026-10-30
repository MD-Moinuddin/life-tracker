import { classNames } from "../../lib/class-names";
import { rangeLabel, SUMMARY_RANGES } from "../../lib/summary-period";
import type { SummaryRange } from "../../lib/summary-period";
import { PeriodNavigator } from "../PeriodNavigator";
import { Button } from "../ui/Button";
import { STICKY_ON_PHONE } from "../ui/sticky-on-phone";
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
