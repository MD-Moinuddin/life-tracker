import { classNames } from "../../lib/class-names";
import { progressPercent } from "../../lib/progress";

export type ProgressTone = "accent" | "warning";

const FILL: Record<ProgressTone, string> = {
  accent: "bg-accent",
  warning: "bg-warning",
};

interface ProgressBarProps {
  value: number;
  max: number;
  label: string;
  // What assistive tech reads instead of the bare number, e.g. "8h of 20h".
  valueText?: string;
  tone?: ProgressTone;
  className?: string;
}

// The visible numbers are always written next to the bar; the bar itself is a
// named progressbar so assistive tech reports the same value. The one place a
// progress bar is drawn.
export function ProgressBar({
  value,
  max,
  label,
  valueText,
  tone = "accent",
  className,
}: ProgressBarProps) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(value, max)}
      aria-valuetext={valueText}
      className={classNames("h-2 rounded-full bg-neutral-soft", className)}
    >
      <div
        className={classNames("h-2 rounded-full", FILL[tone])}
        style={{ width: `${progressPercent(value, max)}%` }}
      />
    </div>
  );
}
