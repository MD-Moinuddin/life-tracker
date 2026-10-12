import { formatTileDate } from "../../lib/shift-format";

// Decorative: the row's text line already says the full date.
export function DateTile({ date }: { date: string }) {
  const { weekday, day } = formatTileDate(date);

  return (
    <div
      aria-hidden="true"
      className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-control bg-accent-soft leading-tight text-accent-ink"
    >
      <span className="text-xs font-semibold">{weekday}</span>
      <span className="text-base font-bold">{day}</span>
    </div>
  );
}
