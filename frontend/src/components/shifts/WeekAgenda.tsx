import { classNames } from "../../lib/class-names";
import { addDays } from "../../lib/dates";
import type { Leave } from "../../lib/leave-api";
import { leaveDaysIn, leaveDaysInWeek } from "../../lib/leave-days";
import { relativeDayLabel } from "../../lib/relative-day";
import { formatDay } from "../../lib/shift-format";
import { totalsLine, totalsOf } from "../../lib/shift-groups";
import type { Shift } from "../../lib/shifts-api";
import { LeaveRow } from "../leave/LeaveRow";
import { cardClassName } from "../ui/Card";
import { EYEBROW_CLASSES } from "../ui/eyebrow";
import { Icon } from "../ui/Icon";
import { ShiftRow } from "./ShiftRow";

interface WeekAgendaProps {
  shifts: Shift[];
  // The week's paid leave; each counted day gets its own row.
  leave?: Leave[];
  weekStart: string;
  today: string;
  onEdit: (shift: Shift) => void;
  onDelete?: (shift: Shift) => void;
  onEditLeave?: (leave: Leave) => void;
  onDeleteLeave?: (leave: Leave) => void;
}

const NO_LEAVE: Leave[] = [];

// One week as seven stacked days, for a phone where seven columns cannot fit.
// Every day is listed, so nothing is hidden, and each shift is the same row as
// in the list, with its own menu.
export function WeekAgenda({
  shifts,
  leave = NO_LEAVE,
  weekStart,
  today,
  onEdit,
  onDelete,
  onEditLeave,
  onDeleteLeave,
}: WeekAgendaProps) {
  const days = Array.from({ length: 7 }, (_, index) =>
    addDays(weekStart, index),
  );
  const totals = totalsOf(shifts);
  const leaveDays = leaveDaysInWeek(leave, weekStart);

  return (
    <>
      <p className="mb-1 text-center text-sm text-ink-muted">
        {totalsLine(totals, leaveDays, { hideNoShifts: true })}
      </p>
      <ol>
        {days.map((day) => {
          const dayShifts = shifts
            .filter((shift) => shift.date === day)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
          const dayTotals = totalsOf(dayShifts);
          const dayLeave = leave.filter(
            (entry) => leaveDaysIn(entry, day, day).length > 0,
          );
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
                {dayLeave.length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-leave-edge bg-leave-soft px-2 py-0.5 text-xs font-semibold text-leave-ink">
                    <Icon name="sun" className="h-3.5 w-3.5 shrink-0" />
                    Paid leave
                  </span>
                )}
                {dayShifts.length > 0 && (
                  <p className="text-sm text-ink-muted">
                    {totalsLine(dayTotals)}
                  </p>
                )}
              </div>
              {dayShifts.length === 0 && dayLeave.length === 0 ? (
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
                  {dayLeave.map((entry) => (
                    <LeaveRow
                      key={entry.id}
                      leave={entry}
                      variant="day"
                      date={day}
                      today={today}
                      onEdit={onEditLeave}
                      onDelete={onDeleteLeave}
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
