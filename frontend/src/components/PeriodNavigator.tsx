import { classNames } from "../lib/class-names";
import { Button } from "./ui/Button";
import { Icon } from "./ui/Icon";

interface PeriodNavigatorProps {
  label: string;
  // The step size in the button names: "week" gives "Previous week".
  unit: string;
  canGoNext?: boolean;
  onPrevious: () => void;
  onNext: () => void;
  // Spacing belongs to the caller; the row has no margin of its own.
  className?: string;
}

export function PeriodNavigator({
  label,
  unit,
  canGoNext = true,
  onPrevious,
  onNext,
  className,
}: PeriodNavigatorProps) {
  return (
    <div
      className={classNames(
        "flex items-center justify-between gap-2",
        className,
      )}
    >
      <Button
        variant="secondary"
        size="compact"
        onClick={onPrevious}
        className="max-sm:min-w-11"
      >
        <Icon name="chevron-left" className="h-4 w-4" />
        <span className="max-sm:sr-only">{`Previous ${unit}`}</span>
      </Button>
      <p
        aria-live="polite"
        className="min-w-0 flex-1 text-center text-sm font-medium text-ink sm:min-w-[10rem] sm:flex-none"
      >
        {label}
      </p>
      <Button
        variant="secondary"
        size="compact"
        onClick={onNext}
        disabled={!canGoNext}
        className="max-sm:min-w-11"
      >
        <span className="max-sm:sr-only">{`Next ${unit}`}</span>
        <Icon name="chevron-right" className="h-4 w-4" />
      </Button>
    </div>
  );
}
