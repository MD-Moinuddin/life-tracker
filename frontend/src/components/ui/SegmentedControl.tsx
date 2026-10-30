import { classNames } from "../../lib/class-names";
import { Icon } from "./Icon";
import type { IconName } from "./Icon";

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  // On a phone the icon replaces the visible label; the label stays as the
  // button's name for assistive tech.
  icon?: IconName;
}

interface SegmentedControlProps<T extends string> {
  label: string;
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  // On a phone, take the whole row and share it between the options.
  fillOnPhone?: boolean;
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
  fillOnPhone = false,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={classNames(
        "inline-flex gap-1 rounded-control bg-neutral-soft p-1",
        fillOnPhone && "max-sm:flex max-sm:flex-1",
      )}
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
              fillOnPhone && "max-sm:flex-1",
              option.icon && "flex items-center justify-center",
              selected
                ? "bg-surface text-ink shadow-card ring-1 ring-control-border font-semibold"
                : "text-ink-muted hover:text-ink font-medium",
            )}
          >
            {option.icon && (
              <Icon name={option.icon} className="h-5 w-5 sm:hidden" />
            )}
            <span className={option.icon ? "max-sm:sr-only" : undefined}>
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
