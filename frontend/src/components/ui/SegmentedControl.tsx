import { classNames } from "../../lib/class-names";

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  label: string;
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

const BUTTON =
  "min-h-9 rounded-control px-4 text-sm transition-colors pointer-coarse:min-h-11";

// A small set of mutually exclusive options. The selected one is raised, so it
// is not shown by colour alone.
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex gap-1 rounded-control bg-neutral-soft p-1"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={classNames(
              BUTTON,
              selected
                ? "bg-surface text-ink shadow-card ring-1 ring-border-strong font-semibold"
                : "text-ink-muted hover:text-ink font-medium",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
