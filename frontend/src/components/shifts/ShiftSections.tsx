import type { LoadState } from "../../hooks/useLoad";
import type { ShiftLists } from "../../hooks/useShiftLists";
import type { Shift } from "../../lib/shifts-api";
import { ShiftList } from "./ShiftList";
import { WeekNavigator } from "./WeekNavigator";

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
  if (state.status === "loading") {
    return <p className="text-slate-600">Loading shifts…</p>;
  }
  if (state.status === "error") {
    return (
      <p role="alert" className="text-red-600">
        Could not load your shifts. Refresh the page to try again.
      </p>
    );
  }
  if (state.data.length === 0) {
    return <p className="text-slate-600">{emptyMessage}</p>;
  }
  return <ShiftList shifts={state.data} onEdit={onEdit} onDelete={onDelete} />;
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
        <WeekNavigator
          from={lists.weekStart}
          to={lists.weekEnd}
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
