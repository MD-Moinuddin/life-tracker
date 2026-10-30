import { formatCents } from "../../lib/shift-earnings";
import { formatDuration } from "../../lib/shift-format";
import type { ShiftWeek } from "../../lib/shift-groups";
import { pluralize } from "../../lib/plural";
import type { Shift } from "../../lib/shifts-api";
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
}

// One week of shifts under a sticky heading that sums it up.
export function ShiftGroup({
  title,
  week,
  today,
  nextShiftId,
  onEdit,
  onDelete,
}: ShiftGroupProps) {
  const types = new Set(week.shifts.map((shift) => shift.job.type));

  return (
    <section className="mb-4 sm:mb-6">
      {/* Pinned from sm up; on a phone the toolbar above is the pinned part. */}
      <div className="flex flex-wrap items-baseline gap-x-3 bg-page py-2 sm:sticky sm:top-0 sm:z-10">
        <h2 className={EYEBROW_CLASSES}>{title}</h2>
        <p className="text-sm text-ink-muted">
          {[
            pluralize(week.count, "shift"),
            formatDuration(week.minutes),
            formatCents(week.cents),
          ].join(" · ")}
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
      </ul>
    </section>
  );
}
