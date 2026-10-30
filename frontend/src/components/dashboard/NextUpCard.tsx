import { Link } from "react-router-dom";
import type { LoadState } from "../../hooks/useLoad";
import { pluralize } from "../../lib/plural";
import { relativeDayLabel } from "../../lib/relative-day";
import { ROUTES } from "../../lib/routes";
import type { Shift } from "../../lib/shifts-api";
import { LoadBoundary } from "../LoadBoundary";
import { ShiftRow } from "../shifts/ShiftRow";
import { Card } from "../ui/Card";
import { EYEBROW_CLASSES } from "../ui/eyebrow";
import { LINK_CLASSES } from "../ui/links";
import { Skeleton } from "../ui/Skeleton";

interface NextUpCardProps {
  // The shifts that have not ended yet, soonest first.
  state: LoadState<Shift[]>;
  today: string;
}

function NextUpSkeleton() {
  return (
    <div role="status" aria-busy="true" className="mt-3 space-y-4">
      <span className="sr-only">Loading your shifts…</span>
      {[0, 1].map((key) => (
        <div key={key} className="flex gap-3">
          <Skeleton className="h-12 w-12 shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Rows({ shifts, today }: { shifts: Shift[]; today: string }) {
  return (
    <ul className="-mx-5 mt-2 divide-y divide-border border-t border-border">
      {shifts.map((shift, index) => (
        <ShiftRow
          key={shift.id}
          shift={shift}
          today={today}
          isNext={index === 0}
        />
      ))}
    </ul>
  );
}

function NextUpContent({ shifts, today }: { shifts: Shift[]; today: string }) {
  const todays = shifts.filter((shift) => shift.date === today);
  const next = shifts[0];

  if (todays.length > 0) {
    return (
      <>
        <p className="text-sm text-ink-muted">
          {pluralize(todays.length, "shift")}
        </p>
        <Rows shifts={todays} today={today} />
      </>
    );
  }

  if (next) {
    const when = relativeDayLabel(next.date, today);
    return (
      <>
        <p className="text-sm text-ink-muted">
          {when
            ? `Nothing today. Your next shift is ${when.toLowerCase()}.`
            : "Nothing today."}
        </p>
        <Rows shifts={[next]} today={today} />
      </>
    );
  }

  return (
    <div className="py-4 text-center">
      <p className="font-semibold text-ink">Nothing planned</p>
      <p className="text-sm text-ink-muted">
        Add your next shift to see it here.
      </p>
    </div>
  );
}

// What is on today, or else the next shift: the first thing to know when you
// open the app.
export function NextUpCard({ state, today }: NextUpCardProps) {
  const hasToday =
    state.status === "ready" &&
    state.data.some((shift) => shift.date === today);

  return (
    <Card padded className="overflow-hidden">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className={EYEBROW_CLASSES}>{hasToday ? "Today" : "Next up"}</h2>
        <Link to={ROUTES.shifts} className={`${LINK_CLASSES} text-sm`}>
          All shifts
        </Link>
      </div>
      <LoadBoundary
        state={state}
        noun="your shifts"
        loading={<NextUpSkeleton />}
      >
        {(shifts) => <NextUpContent shifts={shifts} today={today} />}
      </LoadBoundary>
    </Card>
  );
}
