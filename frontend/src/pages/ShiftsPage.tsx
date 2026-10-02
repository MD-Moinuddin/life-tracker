import { useCallback, useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { ShiftList } from "../components/shifts/ShiftList";
import { WeekNavigator } from "../components/shifts/WeekNavigator";
import { useLoad } from "../hooks/useLoad";
import type { LoadState } from "../hooks/useLoad";
import { addDays, hasEnded, localNow, weekBounds } from "../lib/dates";
import { listShifts } from "../lib/shifts-api";
import type { Shift } from "../lib/shifts-api";

const MAX_PAGE_SIZE = 500;

interface ShiftsBlockProps {
  state: LoadState<Shift[]>;
  emptyMessage: string;
}

function ShiftsBlock({ state, emptyMessage }: ShiftsBlockProps) {
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
  return <ShiftList shifts={state.data} />;
}

export function ShiftsPage() {
  const [now] = useState(localNow);
  const currentWeekStart = weekBounds(now.slice(0, 10)).from;
  const [weekStart, setWeekStart] = useState(currentWeekStart);

  const loadUpcoming = useCallback(async () => {
    const page = await listShifts({
      from: addDays(now.slice(0, 10), -1),
      limit: MAX_PAGE_SIZE,
    });
    return page.items.filter((shift) => !hasEnded(shift, now));
  }, [now]);

  const loadHistory = useCallback(async () => {
    const page = await listShifts({
      from: weekStart,
      to: addDays(weekStart, 6),
      limit: MAX_PAGE_SIZE,
    });
    return page.items.filter((shift) => hasEnded(shift, now)).reverse();
  }, [weekStart, now]);

  const upcoming = useLoad(loadUpcoming);
  const history = useLoad(loadHistory);

  return (
    <AppShell>
      <h1 className="mb-4 text-2xl font-semibold text-slate-900">Shifts</h1>

      <section aria-labelledby="upcoming-heading" className="mb-8">
        <h2
          id="upcoming-heading"
          className="mb-3 text-lg font-medium text-slate-700"
        >
          Upcoming
        </h2>
        <ShiftsBlock state={upcoming} emptyMessage="No upcoming shifts." />
      </section>

      <section aria-labelledby="history-heading">
        <h2
          id="history-heading"
          className="mb-3 text-lg font-medium text-slate-700"
        >
          History
        </h2>
        <WeekNavigator
          from={weekStart}
          to={addDays(weekStart, 6)}
          canGoNext={weekStart < currentWeekStart}
          onPrevious={() => setWeekStart(addDays(weekStart, -7))}
          onNext={() => setWeekStart(addDays(weekStart, 7))}
        />
        <ShiftsBlock
          state={history}
          emptyMessage="No finished shifts in this week."
        />
      </section>
    </AppShell>
  );
}
