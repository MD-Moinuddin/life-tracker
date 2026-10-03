import { formatWeekRange } from "../../lib/shift-format";
import { COMPACT_BUTTON_CLASSES } from "../form/form-styles";

interface WeekNavigatorProps {
  from: string;
  to: string;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

export function WeekNavigator({
  from,
  to,
  canGoNext,
  onPrevious,
  onNext,
}: WeekNavigatorProps) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <button
        type="button"
        onClick={onPrevious}
        className={COMPACT_BUTTON_CLASSES}
      >
        Previous week
      </button>
      <p aria-live="polite" className="text-sm font-medium text-slate-700">
        {formatWeekRange(from, to)}
      </p>
      <button
        type="button"
        onClick={onNext}
        disabled={!canGoNext}
        className={`${COMPACT_BUTTON_CLASSES} disabled:cursor-not-allowed disabled:opacity-50`}
      >
        Next week
      </button>
    </div>
  );
}
