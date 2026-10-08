import type { LoadState } from "../../hooks/useLoad";
import type { ShiftLists } from "../../hooks/useShiftLists";
import { formatDateRange } from "../../lib/shift-format";
import type { Shift } from "../../lib/shifts-api";
import { LoadBoundary } from "../LoadBoundary";
import { PeriodNavigator } from "../PeriodNavigator";
import { ShiftList } from "./ShiftList";

interface ShiftsBlockProps {
  state: LoadState<Shift[]>;
  emptyMessage: string;
  onEdit?: (shift: Shift) => void;
  onDelete?: (shift: Shift) => void;
}

function ShiftsBlock({
  state,
  emptyMessage,
  onEdit,
  onDelete,
}: ShiftsBlockProps) {
  return (
    <LoadBoundary state={state} noun="your shifts">
      {(shifts) =>
        shifts.length === 0 ? (
          <p className="text-slate-600">{emptyMessage}</p>
        ) : (
          <ShiftList shifts={shifts} onEdit={onEdit} onDelete={onDelete} />
        )
      }
    </LoadBoundary>
  );
}

interface ShiftSectionsProps {
  lists: ShiftLists;
  onEdit?: (shift: Shift) => void;
  onDelete?: (shift: Shift) => void;
}

export function ShiftSections({ lists, onEdit, onDelete }: ShiftSectionsProps) {
  return (
    <>
      <section aria-labelledby="upcoming-heading" className="mb-8">
        <h2
          id="upcoming-heading"
          className="mb-3 text-lg font-medium text-slate-700"
        >
          Upcoming
        </h2>
        <ShiftsBlock
          state={lists.upcoming}
          emptyMessage="No upcoming shifts."
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </section>

      <section aria-labelledby="history-heading">
        <h2
          id="history-heading"
          className="mb-3 text-lg font-medium text-slate-700"
        >
          History
        </h2>
        <PeriodNavigator
          label={formatDateRange(lists.weekStart, lists.weekEnd)}
          unit="week"
          canGoNext={lists.canGoNext}
          onPrevious={lists.previousWeek}
          onNext={lists.nextWeek}
        />
        <ShiftsBlock
          state={lists.history}
          emptyMessage="No finished shifts in this week."
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </section>
    </>
  );
}
