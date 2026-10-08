import { COMPACT_BUTTON_CLASSES } from "./form/form-styles";

interface PeriodNavigatorProps {
  label: string;
  // The step size in the button names: "week" gives "Previous week".
  unit: string;
  canGoNext?: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

export function PeriodNavigator({
  label,
  unit,
  canGoNext = true,
  onPrevious,
  onNext,
}: PeriodNavigatorProps) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <button
        type="button"
        onClick={onPrevious}
        className={COMPACT_BUTTON_CLASSES}
      >
        {`Previous ${unit}`}
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
        disabled={!canGoNext}
        className={`${COMPACT_BUTTON_CLASSES} disabled:cursor-not-allowed disabled:opacity-50`}
      >
        {`Next ${unit}`}
      </button>
    </div>
  );
}
