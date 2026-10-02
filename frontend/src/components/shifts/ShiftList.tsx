import {
  formatDay,
  formatDuration,
  formatTimeRange,
} from "../../lib/shift-format";
import type { Shift } from "../../lib/shifts-api";
import { LIST_CLASSES } from "../form/form-styles";

interface ShiftListProps {
  shifts: Shift[];
}

export function ShiftList({ shifts }: ShiftListProps) {
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
          <p className="text-sm font-medium text-slate-900">
            {formatDuration(shift.workedMinutes)}
          </p>
        </li>
      ))}
    </ul>
  );
}
