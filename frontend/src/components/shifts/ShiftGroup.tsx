import type { Leave } from "../../lib/leave-api";
import { leaveTotals } from "../../lib/leave-days";
import { totalsLine } from "../../lib/shift-groups";
import type { ShiftWeek } from "../../lib/shift-groups";
import type { Shift } from "../../lib/shifts-api";
import { LeaveRow } from "../leave/LeaveRow";
import { cardClassName } from "../ui/Card";
import { EYEBROW_CLASSES } from "../ui/eyebrow";
import { ShiftRow } from "./ShiftRow";

interface ShiftGroupProps {
  title: string;
  week: ShiftWeek;
  today: string;
  // The one shift to highlight as next, if it is in this group.
  nextShiftId?: string;
  onEdit?: (shift: Shift) => void;
  onDelete?: (shift: Shift) => void;
  // The leave periods of this group, listed after the shifts.
  leave?: Leave[];
  // The days of paid leave the heading names; all the periods' counted days
  // when not given.
  leaveDays?: number;
  onEditLeave?: (leave: Leave) => void;
  onDeleteLeave?: (leave: Leave) => void;
}

const NO_LEAVE: Leave[] = [];

// One week of shifts, and the leave that starts in it, under a sticky heading
// that sums it up.
export function ShiftGroup({
  title,
  week,
  today,
  nextShiftId,
  onEdit,
  onDelete,
  leave = NO_LEAVE,
  leaveDays,
  onEditLeave,
  onDeleteLeave,
}: ShiftGroupProps) {
  const types = new Set(week.shifts.map((shift) => shift.job.type));

  return (
    <section className="mb-4 sm:mb-6">
      {/* Pinned from sm up; on a phone the toolbar above is the pinned part. */}
      <div className="flex flex-wrap items-baseline gap-x-3 bg-page py-2 sm:sticky sm:top-0 sm:z-10">
        <h2 className={EYEBROW_CLASSES}>{title}</h2>
        <p className="text-sm text-ink-muted">
          {totalsLine(
            week,
            leaveDays ??
              leave.reduce((sum, entry) => sum + leaveTotals(entry).days, 0),
            { hideNoShifts: true },
          )}
        </p>
      </div>
      <ul className={cardClassName("plain", "divide-y divide-border")}>
        {week.shifts.map((shift) => (
          <ShiftRow
            key={shift.id}
            shift={shift}
            today={today}
            isNext={shift.id === nextShiftId}
            showType={types.size > 1}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
        {leave.map((entry) => (
          <LeaveRow
            key={entry.id}
            leave={entry}
            variant="period"
            showJob
            today={today}
            onEdit={onEditLeave}
            onDelete={onDeleteLeave}
          />
        ))}
      </ul>
    </section>
  );
}
