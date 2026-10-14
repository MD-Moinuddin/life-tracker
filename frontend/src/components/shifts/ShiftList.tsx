import {
  formatDay,
  formatDuration,
  formatTimeRange,
} from "../../lib/shift-format";
import type { Shift } from "../../lib/shifts-api";
import { JobTypeBadge } from "../jobs/JobTypeBadge";
import { Button } from "../ui/Button";
import { cardClassName } from "../ui/Card";
import { DateTile } from "./DateTile";

interface ShiftListProps {
  shifts: Shift[];
  onEdit?: (shift: Shift) => void;
  onDelete?: (shift: Shift) => void;
}

function describeShift(shift: Shift) {
  return `${shift.job.name}, ${formatDay(shift.date)}, ${formatTimeRange(shift)}`;
}

export function ShiftList({ shifts, onEdit, onDelete }: ShiftListProps) {
  return (
    <ul
      className={cardClassName(
        "plain",
        "divide-y divide-border overflow-hidden",
      )}
    >
      {shifts.map((shift) => (
        <li
          key={shift.id}
          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
        >
          <div className="flex min-w-0 items-start gap-3">
            <DateTile date={shift.date} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-ink">{shift.job.name}</p>
                <JobTypeBadge type={shift.job.type} />
              </div>
              <p className="text-sm text-ink-muted">
                {`${formatDay(shift.date)}, ${formatTimeRange(shift)}`}
              </p>
              {shift.notes && (
                <p className="mt-1 text-sm text-ink-muted">{shift.notes}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium text-ink">
              {formatDuration(shift.workedMinutes)}
            </p>
            {onEdit && (
              <Button
                variant="secondary"
                size="compact"
                onClick={() => onEdit(shift)}
                aria-label={`Edit ${describeShift(shift)}`}
              >
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                variant="danger-outline"
                size="compact"
                onClick={() => onDelete(shift)}
                aria-label={`Delete ${describeShift(shift)}`}
              >
                Delete
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
