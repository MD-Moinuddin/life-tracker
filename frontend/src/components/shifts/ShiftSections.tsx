import { useState } from "react";
import type { ReactNode } from "react";
import type { LoadState } from "../../hooks/useLoad";
import type { ShiftLists } from "../../hooks/useShiftLists";
import { formatDateRange } from "../../lib/shift-format";
import { groupByWeek, weekTitle } from "../../lib/shift-groups";
import type { Shift } from "../../lib/shifts-api";
import { LoadBoundary } from "../LoadBoundary";
import { PeriodNavigator } from "../PeriodNavigator";
import { EmptyState } from "../ui/EmptyState";
import { SegmentedControl } from "../ui/SegmentedControl";
import { ShiftGroup } from "./ShiftGroup";

type Tab = "upcoming" | "history";

const TAB_OPTIONS: { value: Tab; label: string }[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "history", label: "History" },
];

interface ShiftsBlockProps {
  state: LoadState<Shift[]>;
  emptyMessage: string;
  today: string;
  highlightNext?: boolean;
  onEdit?: (shift: Shift) => void;
  onDelete?: (shift: Shift) => void;
}

function ShiftsBlock({
  state,
  emptyMessage,
  today,
  highlightNext = false,
  onEdit,
  onDelete,
}: ShiftsBlockProps) {
  return (
    <LoadBoundary state={state} noun="your shifts">
      {(shifts) =>
        shifts.length === 0 ? (
          <EmptyState>{emptyMessage}</EmptyState>
        ) : (
          groupByWeek(shifts).map((week) => (
            <ShiftGroup
              key={week.weekStart}
              title={weekTitle(week.weekStart, today, formatDateRange)}
              week={week}
              today={today}
              nextShiftId={highlightNext ? shifts[0]?.id : undefined}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        )
      }
    </LoadBoundary>
  );
}

interface ShiftSectionsProps {
  lists: ShiftLists;
  // Sits at the right of the tabs, e.g. a view switch.
  toolbarEnd?: ReactNode;
  onEdit?: (shift: Shift) => void;
  onDelete?: (shift: Shift) => void;
}

export function ShiftSections({
  lists,
  toolbarEnd,
  onEdit,
  onDelete,
}: ShiftSectionsProps) {
  const [tab, setTab] = useState<Tab>("upcoming");

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl
          label="Shift period"
          options={TAB_OPTIONS}
          value={tab}
          onChange={setTab}
        />
        {toolbarEnd}
      </div>

      {tab === "upcoming" ? (
        <section aria-label="Upcoming shifts">
          <ShiftsBlock
            state={lists.upcoming}
            emptyMessage="No upcoming shifts."
            today={lists.today}
            highlightNext
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </section>
      ) : (
        <section aria-label="Shift history">
          <PeriodNavigator
            className="mb-3"
            label={formatDateRange(lists.weekStart, lists.weekEnd)}
            unit="week"
            canGoNext={lists.canGoNext}
            onPrevious={lists.previousWeek}
            onNext={lists.nextWeek}
          />
          <ShiftsBlock
            state={lists.history}
            emptyMessage="No finished shifts in this week."
            today={lists.today}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </section>
      )}
    </>
  );
}
