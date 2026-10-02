import {
  formatDay,
  formatDuration,
  formatTimeRange,
} from "../../lib/shift-format";
import type { Shift } from "../../lib/shifts-api";
import {
  COMPACT_BUTTON_CLASSES,
  COMPACT_DANGER_BUTTON_CLASSES,
  LIST_CLASSES,
} from "../form/form-styles";

interface ShiftListProps {
  shifts: Shift[];
  onEdit: (shift: Shift) => void;
  onDelete: (shift: Shift) => void;
}

function describeShift(shift: Shift) {
  return `${shift.job.name}, ${formatDay(shift.date)}, ${formatTimeRange(shift)}`;
}

export function ShiftList({ shifts, onEdit, onDelete }: ShiftListProps) {
  return (
    <ul className={LIST_CLASSES}>
      {shifts.map((shift) => (
        <li
          key={shift.id}
          className="flex flex-wrap items-start justify-between gap-2 px-4 py-3"
        >
          <div>
            <p className="font-medium text-slate-900">{shift.job.name}</p>
            <p className="text-sm text-slate-600">
              {`${formatDay(shift.date)}, ${formatTimeRange(shift)}`}
            </p>
            {shift.notes && (
              <p className="mt-1 text-sm text-slate-600">{shift.notes}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm font-medium text-slate-900">
              {formatDuration(shift.workedMinutes)}
            </p>
            <button
              type="button"
              onClick={() => onEdit(shift)}
              aria-label={`Edit ${describeShift(shift)}`}
              className={COMPACT_BUTTON_CLASSES}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete(shift)}
              aria-label={`Delete ${describeShift(shift)}`}
              className={COMPACT_DANGER_BUTTON_CLASSES}
            >
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
