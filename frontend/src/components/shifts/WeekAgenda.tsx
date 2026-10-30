import { classNames } from "../../lib/class-names";
import { addDays } from "../../lib/dates";
import { relativeDayLabel } from "../../lib/relative-day";
import { formatCents } from "../../lib/shift-earnings";
import { formatDay, formatDuration } from "../../lib/shift-format";
import { totalsOf } from "../../lib/shift-groups";
import { pluralize } from "../../lib/plural";
import type { Shift } from "../../lib/shifts-api";
import { cardClassName } from "../ui/Card";
import { EYEBROW_CLASSES } from "../ui/eyebrow";
import { ShiftRow } from "./ShiftRow";

interface WeekAgendaProps {
  shifts: Shift[];
  weekStart: string;
  today: string;
  onEdit: (shift: Shift) => void;
  onDelete?: (shift: Shift) => void;
}

// One week as seven stacked days, for a phone where seven columns cannot fit.
// Every day is listed, so nothing is hidden, and each shift is the same row as
// in the list, with its own menu.
export function WeekAgenda({
  shifts,
  weekStart,
  today,
  onEdit,
  onDelete,
}: WeekAgendaProps) {
  const days = Array.from({ length: 7 }, (_, index) =>
    addDays(weekStart, index),
  );
  const totals = totalsOf(shifts);

  return (
    <>
      <p className="mb-1 text-center text-sm text-ink-muted">
        {[
          pluralize(totals.count, "shift"),
          formatDuration(totals.minutes),
          formatCents(totals.cents),
        ].join(" · ")}
      </p>
      <ol>
        {days.map((day) => {
          const dayShifts = shifts
            .filter((shift) => shift.date === day)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
          const dayTotals = totalsOf(dayShifts);
          const relative = relativeDayLabel(day, today);
          return (
            <li
              key={day}
              aria-current={day === today ? "date" : undefined}
              className="mb-2"
            >
              <div className="flex flex-wrap items-baseline gap-x-2.5 py-2">
                <h2
                  className={classNames(
                    EYEBROW_CLASSES,
                    day === today && "text-accent",
                  )}
                >
                  {formatDay(day)}
                </h2>
                {relative && (
                  <span
                    className={classNames(
                      "rounded-full px-2 py-0.5 text-xs font-semibold",
                      relative === "Today"
                        ? "bg-accent text-on-accent"
                        : "bg-neutral-soft text-ink-muted",
                    )}
                  >
                    {relative}
                  </span>
                )}
                {dayShifts.length > 0 && (
                  <p className="text-sm text-ink-muted">
                    {[
                      pluralize(dayTotals.count, "shift"),
                      formatDuration(dayTotals.minutes),
                      formatCents(dayTotals.cents),
                    ].join(" · ")}
                  </p>
                )}
              </div>
              {dayShifts.length === 0 ? (
                <p className="px-1 text-sm text-ink-muted">No shifts</p>
              ) : (
                <ul
                  className={cardClassName("plain", "divide-y divide-border")}
                >
                  {dayShifts.map((shift) => (
                    <ShiftRow
                      key={shift.id}
                      shift={shift}
                      today={today}
                      showRelativeDay={false}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
    </>
  );
}
