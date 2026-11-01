import { classNames } from "../../lib/class-names";
import { formatTileDate } from "../../lib/shift-format";

const TONES = {
  accent: "bg-accent-soft text-accent-ink",
  // On a paid-leave row, which is already leave-soft.
  leave: "bg-surface text-leave-ink",
} as const;

// Decorative: the row's text line already says the full date.
export function DateTile({
  date,
  tone = "accent",
}: {
  date: string;
  tone?: keyof typeof TONES;
}) {
  const { weekday, day } = formatTileDate(date);

  return (
    <div
      aria-hidden="true"
      className={classNames(
        "flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-control leading-tight",
        TONES[tone],
      )}
    >
      <span className="text-xs font-semibold">{weekday}</span>
      <span className="text-base font-bold">{day}</span>
    </div>
  );
}
