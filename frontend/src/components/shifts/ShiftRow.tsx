import { classNames } from "../../lib/class-names";
import { jobColor } from "../../lib/job-color";
import { relativeDayLabel } from "../../lib/relative-day";
import { formatCents, shiftEarningsCents } from "../../lib/shift-earnings";
import {
  formatDay,
  formatDuration,
  formatTimeRange,
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
  onEdit,
  onDelete,
}: ShiftRowProps) {
  const relative = relativeDayLabel(shift.date, today);
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
        "flex items-center gap-4 border-l-4 py-3 pr-3 pl-4 first:rounded-t-card last:rounded-b-card",
        jobColor(shift.jobId).edge,
        isNext && "bg-accent-soft/40",
      )}
    >
      <DateTile date={shift.date} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-ink">{shift.job.name}</p>
          {showType && <JobTypeBadge type={shift.job.type} />}
        </div>
        <p className="text-sm text-ink-muted">
          <span className="sr-only">{`${formatDay(shift.date)}, `}</span>
          {formatTimeRange(shift)}
        </p>
        {shift.notes && (
          <p className="mt-1 text-sm text-ink-muted">{shift.notes}</p>
        )}
      </div>
      {relative && (
        <span
          className={classNames(
            "rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
            relative === "Today"
              ? "bg-accent text-on-accent"
              : "bg-neutral-soft text-ink-muted",
          )}
        >
          {relative}
        </span>
      )}
      <div className="min-w-24 text-right">
        <p className="font-semibold text-ink">
          {formatCents(shiftEarningsCents(shift))}
        </p>
        <p className="text-sm text-ink-muted">
          {formatDuration(shift.workedMinutes)}
        </p>
      </div>
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
