import type { ReactNode } from "react";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { useWeekShifts } from "../../hooks/useWeekShifts";
import { PHONE_QUERY } from "../../lib/breakpoints";
import { addDays } from "../../lib/dates";
import { classNames } from "../../lib/class-names";
import { jobColor } from "../../lib/job-color";
import { formatCents, shiftEarningsCents } from "../../lib/shift-earnings";
import {
  formatDateRange,
  formatDay,
  formatDuration,
  formatTimeRange,
} from "../../lib/shift-format";
import { pluralize } from "../../lib/plural";
import { totalsOf } from "../../lib/shift-groups";
import type { Shift } from "../../lib/shifts-api";
import { LoadBoundary } from "../LoadBoundary";
import { PeriodNavigator } from "../PeriodNavigator";
import { STICKY_ON_PHONE } from "../ui/sticky-on-phone";
import { WeekAgenda } from "./WeekAgenda";

interface WeekViewProps {
  // Bumped by the page after a shift changes, so the week fetches again.
  version: number;
  // Sits at the right above the week, e.g. a view switch.
  toolbarEnd?: ReactNode;
  onEdit: (shift: Shift) => void;
  // Only the phone agenda has a delete; the day columns open the shift to edit.
  onDelete?: (shift: Shift) => void;
}

function describeShift(shift: Shift) {
  return `${shift.job.name}, ${formatDay(shift.date)}, ${formatTimeRange(shift)}`;
}

function ShiftChip({
  shift,
  onEdit,
}: {
  shift: Shift;
  onEdit: (shift: Shift) => void;
}) {
  return (
    <button
      type="button"
      aria-label={`Edit ${describeShift(shift)}`}
      onClick={() => onEdit(shift)}
      className={classNames(
        "w-full rounded-control border border-l-4 border-border bg-surface px-2 py-1.5 text-left transition-colors hover:bg-neutral-soft",
        jobColor(shift.jobId).edge,
      )}
    >
      <span className="block text-sm font-semibold text-ink">
        {shift.job.name}
      </span>
      <span className="block text-xs text-ink-muted">
        {formatTimeRange(shift)}
      </span>
      <span className="block text-xs font-semibold text-ink">
        {`${formatDuration(shift.workedMinutes)} · ${formatCents(shiftEarningsCents(shift))}`}
      </span>
    </button>
  );
}

function WeekGrid({
  shifts,
  weekStart,
  today,
  onEdit,
}: {
  shifts: Shift[];
  weekStart: string;
  today: string;
  onEdit: (shift: Shift) => void;
}) {
  const days = Array.from({ length: 7 }, (_, index) =>
    addDays(weekStart, index),
  );
  const totals = totalsOf(shifts);

  return (
    <>
      <p className="mb-3 text-center text-sm text-ink-muted">
        {[
          pluralize(totals.count, "shift"),
          formatDuration(totals.minutes),
          formatCents(totals.cents),
        ].join(" · ")}
      </p>
      <ol className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const dayShifts = shifts
            .filter((shift) => shift.date === day)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
          return (
            <li
              key={day}
              aria-current={day === today ? "date" : undefined}
              className={classNames(
                "min-h-48 min-w-0 rounded-card border bg-surface p-2",
                day === today
                  ? "border-accent ring-1 ring-accent"
                  : "border-border",
              )}
            >
              <h2 className="mb-2 text-xs font-bold tracking-wider text-ink-muted uppercase">
                {formatDay(day)}
              </h2>
              {dayShifts.length === 0 ? (
                <p className="text-xs text-ink-muted">No shifts</p>
              ) : (
                <ul className="space-y-1.5">
                  {dayShifts.map((shift) => (
                    <li key={shift.id}>
                      <ShiftChip shift={shift} onEdit={onEdit} />
                    </li>
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

// One week as seven day columns, or as a day-by-day agenda on a phone.
// Pressing a shift in the columns opens it for editing.
export function WeekView({
  version,
  toolbarEnd,
  onEdit,
  onDelete,
}: WeekViewProps) {
  const week = useWeekShifts(version);
  const isPhone = useMediaQuery(PHONE_QUERY);

  return (
    <section aria-label="Week view">
      <div className={STICKY_ON_PHONE}>
        <div className="mb-4 flex justify-end max-sm:mb-2">{toolbarEnd}</div>
        <PeriodNavigator
          className="mb-2 max-sm:mb-0"
          label={formatDateRange(week.weekStart, week.weekEnd)}
          unit="week"
          onPrevious={week.previousWeek}
          onNext={week.nextWeek}
        />
      </div>
      <LoadBoundary state={week.state} noun="your shifts">
        {(shifts) =>
          isPhone ? (
            <WeekAgenda
              shifts={shifts}
              weekStart={week.weekStart}
              today={week.today}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ) : (
            <WeekGrid
              shifts={shifts}
              weekStart={week.weekStart}
              today={week.today}
              onEdit={onEdit}
            />
          )
        }
      </LoadBoundary>
    </section>
  );
}
