import type { ReactNode } from "react";
import type { TrackableJob } from "../../hooks/useLeave";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { useWeekShifts } from "../../hooks/useWeekShifts";
import { PHONE_QUERY } from "../../lib/breakpoints";
import { addDays } from "../../lib/dates";
import { classNames } from "../../lib/class-names";
import { jobColor } from "../../lib/job-color";
import type { Leave } from "../../lib/leave-api";
import {
  isLeaveDayTaken,
  leaveDayCents,
  leaveDaysIn,
  leaveDaysInWeek,
} from "../../lib/leave-days";
import { formatCents, shiftEarningsCents } from "../../lib/shift-earnings";
import {
  formatDateRange,
  formatDay,
  formatDuration,
  formatTimeRange,
} from "../../lib/shift-format";
import { totalsLine, totalsOf } from "../../lib/shift-groups";
import type { Shift } from "../../lib/shifts-api";
import { LoadBoundary } from "../LoadBoundary";
import { PeriodNavigator } from "../PeriodNavigator";
import { Icon } from "../ui/Icon";
import { STICKY_ON_PHONE } from "../ui/sticky-on-phone";
import { WeekAgenda } from "./WeekAgenda";

interface WeekViewProps {
  // Bumped by the page after a shift changes, so the week's shifts fetch
  // again.
  version: number;
  // Bumped by the page after leave changes, so the week's leave fetches again.
  leaveVersion?: number;
  // Sits at the right above the week, e.g. a view switch.
  toolbarEnd?: ReactNode;
  onEdit: (shift: Shift) => void;
  // Only the phone agenda has a delete; the day columns open the shift to edit.
  onDelete?: (shift: Shift) => void;
  // The loaded jobs (null until known). The week's paid leave is only asked
  // for when one of them tracks vacation.
  jobs?: readonly TrackableJob[] | null;
  // As for shifts: the columns open leave to edit; the agenda has a menu.
  onEditLeave?: (leave: Leave) => void;
  onDeleteLeave?: (leave: Leave) => void;
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

const LEAVE_BLOCK_CLASSES =
  "block w-full rounded-control border border-l-4 border-leave-edge bg-leave-soft px-2 py-1.5 text-left text-leave-ink";

// One counted day of paid leave in a day column: the sun icon and "Paid
// leave", the job, the day's hours and pay, and Planned or Taken in words.
function LeaveBlock({
  leave,
  day,
  today,
  onEdit,
}: {
  leave: Leave;
  day: string;
  today: string;
  onEdit?: (leave: Leave) => void;
}) {
  const content = (
    <>
      <span className="flex items-center gap-1 text-sm font-semibold">
        <Icon name="sun" className="h-3.5 w-3.5 shrink-0 text-leave" />
        Paid leave
      </span>
      <span className="block text-xs">{leave.job.name}</span>
      <span className="block text-xs font-semibold">
        {`${formatDuration(leave.minutesPerDay)} · ${formatCents(leaveDayCents(leave))}`}
      </span>
      <span className="block text-xs">
        {isLeaveDayTaken(day, today) ? "Taken" : "Planned"}
      </span>
    </>
  );
  if (!onEdit) {
    return <div className={LEAVE_BLOCK_CLASSES}>{content}</div>;
  }
  return (
    <button
      type="button"
      aria-label={`Edit paid leave, ${leave.job.name}, ${formatDay(day)}`}
      onClick={() => onEdit(leave)}
      className={classNames(
        LEAVE_BLOCK_CLASSES,
        "transition-colors hover:bg-surface",
      )}
    >
      {content}
    </button>
  );
}

function WeekGrid({
  shifts,
  leave,
  weekStart,
  today,
  onEdit,
  onEditLeave,
}: {
  shifts: Shift[];
  leave: Leave[];
  weekStart: string;
  today: string;
  onEdit: (shift: Shift) => void;
  onEditLeave?: (leave: Leave) => void;
}) {
  const days = Array.from({ length: 7 }, (_, index) =>
    addDays(weekStart, index),
  );
  const totals = totalsOf(shifts);
  const leaveDays = leaveDaysInWeek(leave, weekStart);

  return (
    <>
      <p className="mb-3 text-center text-sm text-ink-muted">
        {totalsLine(totals, leaveDays, { hideNoShifts: true })}
      </p>
      <ol className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const dayShifts = shifts
            .filter((shift) => shift.date === day)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
          const dayLeave = leave.filter(
            (entry) => leaveDaysIn(entry, day, day).length > 0,
          );
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
              {dayShifts.length === 0 && dayLeave.length === 0 ? (
                <p className="text-xs text-ink-muted">No shifts</p>
              ) : (
                <ul className="space-y-1.5">
                  {dayShifts.map((shift) => (
                    <li key={shift.id}>
                      <ShiftChip shift={shift} onEdit={onEdit} />
                    </li>
                  ))}
                  {dayLeave.map((entry) => (
                    <li key={entry.id}>
                      <LeaveBlock
                        leave={entry}
                        day={day}
                        today={today}
                        onEdit={onEditLeave}
                      />
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

// One week as seven day columns, or as a day-by-day agenda on a phone, with
// the week's paid leave on its counted days. Pressing a shift or a leave
// block in the columns opens it for editing.
const NO_LEAVE: Leave[] = [];

export function WeekView({
  version,
  leaveVersion = 0,
  toolbarEnd,
  onEdit,
  onDelete,
  jobs = null,
  onEditLeave,
  onDeleteLeave,
}: WeekViewProps) {
  const week = useWeekShifts(version, jobs, leaveVersion);
  // The shifts never wait for the leave, and a failed leave request is none.
  const leave = week.leave.status === "ready" ? week.leave.data : NO_LEAVE;
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
              leave={leave}
              weekStart={week.weekStart}
              today={week.today}
              onEdit={onEdit}
              onDelete={onDelete}
              onEditLeave={onEditLeave}
              onDeleteLeave={onDeleteLeave}
            />
          ) : (
            <WeekGrid
              shifts={shifts}
              leave={leave}
              weekStart={week.weekStart}
              today={week.today}
              onEdit={onEdit}
              onEditLeave={onEditLeave}
            />
          )
        }
      </LoadBoundary>
    </section>
  );
}
