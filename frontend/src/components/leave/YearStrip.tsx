import { classNames } from "../../lib/class-names";
import { chipClassName } from "../ui/chip";
import { cardClassName, CARD_PADDING } from "../ui/Card";
import { formatLeavePeriod } from "../../lib/shift-format";
import type { Leave } from "../../lib/leave-api";
import { isLeavePlanned } from "../../lib/leave-days";
import { PLANNED_STYLE } from "./planned-style";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const DAY_MS = 86_400_000;

function utc(date: string) {
  return Date.parse(`${date}T00:00:00Z`);
}

// Which day of the year (0 = 1 January); outside the year it runs past either end.
function dayIndex(date: string, year: number) {
  return Math.round((utc(date) - utc(`${year}-01-01`)) / DAY_MS);
}

function daysInYear(year: number) {
  return Math.round((utc(`${year + 1}-01-01`) - utc(`${year}-01-01`)) / DAY_MS);
}

interface YearStripProps {
  year: number;
  leave: Leave[];
  today: string;
}

// The year as a strip, with each leave entry drawn where it falls. Planned
// leave (not yet over) is hatched.
export function YearStrip({ year, leave, today }: YearStripProps) {
  const total = daysInYear(year);
  const inYear = [...leave]
    .filter(
      (entry) =>
        entry.endDate >= `${year}-01-01` && entry.startDate <= `${year}-12-31`,
    )
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const label =
    inYear.length === 0
      ? `No paid leave booked in ${year}`
      : `Your paid leave in ${year}: ${inYear
          .map((entry) => formatLeavePeriod(entry.startDate, entry.endDate))
          .join(", ")}`;
  const todayIndex = dayIndex(today, year);

  return (
    <div>
      <div
        role="img"
        aria-label={label}
        className="relative h-9 overflow-hidden rounded-control bg-neutral-soft"
      >
        {inYear.map((entry) => {
          const start = Math.max(0, dayIndex(entry.startDate, year));
          const end = Math.min(total - 1, dayIndex(entry.endDate, year));
          const planned = isLeavePlanned(entry, today);
          return (
            <span
              key={entry.id}
              data-block={entry.id}
              data-planned={String(planned)}
              className={classNames(
                "absolute top-1 bottom-1 min-w-1.5 rounded-sm",
                planned ? "border border-leave-edge" : "bg-leave",
              )}
              style={{
                left: `${(start / total) * 100}%`,
                width: `${((end - start + 1) / total) * 100}%`,
                ...(planned ? PLANNED_STYLE : {}),
              }}
            />
          );
        })}
        {todayIndex >= 0 && todayIndex < total && (
          <span
            data-today
            className="absolute top-0 bottom-0 w-0.5 bg-accent"
            style={{ left: `${(todayIndex / total) * 100}%` }}
          />
        )}
      </div>
      <div
        aria-hidden="true"
        className="mt-1 flex justify-between text-xs text-ink-muted"
      >
        {MONTHS.map((month) => (
          <span key={month}>{month}</span>
        ))}
      </div>
    </div>
  );
}

interface YearSwitchProps {
  year: number;
  // The years that can be chosen, in order.
  years: number[];
  onChange: (year: number) => void;
}

// Buttons to switch which year the section shows.
export function YearSwitch({ year, years, onChange }: YearSwitchProps) {
  return (
    <div role="group" aria-label="Year" className="flex flex-wrap gap-2">
      {years.map((choice) => (
        <button
          key={choice}
          type="button"
          aria-pressed={choice === year}
          onClick={() => onChange(choice)}
          className={chipClassName(choice === year, "compact")}
        >
          {choice}
        </button>
      ))}
    </div>
  );
}

// The strip inside its own card, as the job page shows it.
export function YearStripCard(props: YearStripProps) {
  return (
    <div className={cardClassName("plain", CARD_PADDING)}>
      <YearStrip {...props} />
    </div>
  );
}
