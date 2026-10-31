import { classNames } from "../../lib/class-names";

export type ChipSize = "default" | "compact";

// One horizontal padding per size, so a chip never carries two.
const SIZES: Record<ChipSize, string> = {
  default: "px-3.5",
  // Short labels in a row (days of the week): narrower, but never thinner
  // than 48px.
  compact: "min-w-12 px-2",
};

// The look of a quick-choice button (a break length, a day of the week, hours
// per day), with aria-pressed telling which one is picked. Shared, so every
// row of choices looks the same and changes in one place.
export function chipClassName(
  selected: boolean,
  size: ChipSize = "default",
): string {
  return classNames(
    "min-h-11 rounded-full border text-sm font-medium transition-colors disabled:opacity-60",
    SIZES[size],
    selected
      ? "border-accent bg-accent-soft font-semibold text-accent-ink"
      : "border-border-strong bg-surface text-ink hover:bg-neutral-soft",
  );
}
