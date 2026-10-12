import { Button } from "./ui/Button";
import { Icon } from "./ui/Icon";

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
      <Button variant="secondary" size="compact" onClick={onPrevious}>
        <Icon name="chevron-left" className="h-4 w-4" />
        {`Previous ${unit}`}
      </Button>
      <p
        aria-live="polite"
        className="min-w-[10rem] text-center text-sm font-medium text-ink"
      >
        {label}
      </p>
      <Button
        variant="secondary"
        size="compact"
        onClick={onNext}
        disabled={!canGoNext}
      >
        {`Next ${unit}`}
        <Icon name="chevron-right" className="h-4 w-4" />
      </Button>
    </div>
  );
}
