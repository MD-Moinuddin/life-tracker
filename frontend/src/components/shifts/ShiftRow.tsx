import { classNames } from "../../lib/class-names";
import { jobColor } from "../../lib/job-color";
import { relativeDayLabel } from "../../lib/relative-day";
import { formatCents, shiftEarningsCents } from "../../lib/shift-earnings";
import {
  formatDay,
  formatDuration,
  formatTimeRange,
  formatTimeSpan,
} from "../../lib/shift-format";
import type { Shift } from "../../lib/shifts-api";
import { JobTypeBadge } from "../jobs/JobTypeBadge";
import { ActionMenu } from "../ui/ActionMenu";
import type { ActionMenuItem } from "../ui/ActionMenu";
import { DateTile } from "./DateTile";

interface ShiftRowProps {
  shift: Shift;
  today: string;
  // The next shift to start: drawn with a soft highlight.
  isNext?: boolean;
  // Show the job's type badge. Rows of one type leave it to the group.
  showType?: boolean;
  // Name the day ("Today", "Tomorrow") on the row. Off where a heading already
  // names the day.
  showRelativeDay?: boolean;
  onEdit?: (shift: Shift) => void;
  onDelete?: (shift: Shift) => void;
}

function describeShift(shift: Shift) {
  return `${shift.job.name}, ${formatDay(shift.date)}, ${formatTimeRange(shift)}`;
}

export function ShiftRow({
  shift,
  today,
  isNext = false,
  showType = false,
  showRelativeDay = true,
  onEdit,
  onDelete,
}: ShiftRowProps) {
  const relative = showRelativeDay ? relativeDayLabel(shift.date, today) : null;
  const actions: ActionMenuItem[] = [];
  if (onEdit) {
    actions.push({ label: "Edit shift", onSelect: () => onEdit(shift) });
  }
  if (onDelete) {
    actions.push({
      label: "Delete shift…",
      tone: "danger",
      onSelect: () => onDelete(shift),
    });
  }

  return (
    <li
      className={classNames(
        "flex items-center gap-3 border-l-4 py-2.5 pr-1 pl-3 first:rounded-t-card last:rounded-b-card sm:gap-4 sm:py-3 sm:pr-3 sm:pl-4",
        jobColor(shift.jobId).edge,
        isNext && "bg-accent-soft/40",
      )}
    >
      <DateTile date={shift.date} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <p className="min-w-0 truncate font-semibold text-ink">
            {shift.job.name}
          </p>
          {relative && (
            <span
              className={classNames(
                "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap",
                relative === "Today"
                  ? "bg-accent text-on-accent"
                  : "bg-neutral-soft text-ink-muted",
              )}
            >
              {relative}
            </span>
          )}
          {/* The colour edge and the name tell jobs apart on a phone. */}
          {showType && (
            <span className="max-sm:hidden">
              <JobTypeBadge type={shift.job.type} />
            </span>
          )}
        </div>
        <p className="text-sm whitespace-nowrap text-ink-muted tabular-nums">
          <span className="sr-only">
            {`${formatDay(shift.date)}, ${formatTimeRange(shift)}, ${formatDuration(shift.workedMinutes)}`}
          </span>
          <span aria-hidden="true">
            {`${formatTimeSpan(shift)} · ${formatDuration(shift.workedMinutes)}`}
          </span>
        </p>
        {shift.notes && (
          <p className="mt-1 text-sm text-ink-muted">{shift.notes}</p>
        )}
      </div>
      <p className="font-semibold text-ink tabular-nums">
        {formatCents(shiftEarningsCents(shift))}
      </p>
      {actions.length > 0 ? (
        <ActionMenu
          label={`Actions for ${describeShift(shift)}`}
          items={actions}
        />
      ) : (
        // Keeps the columns aligned on read-only lists.
        <span aria-hidden="true" className="w-9 shrink-0" />
      )}
    </li>
  );
}
