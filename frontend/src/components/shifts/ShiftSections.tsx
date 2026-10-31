import { useState } from "react";
import type { ReactNode } from "react";
import type { LoadState } from "../../hooks/useLoad";
import type { ShiftLists } from "../../hooks/useShiftLists";
import type { Leave } from "../../lib/leave-api";
import { formatDateRange } from "../../lib/shift-format";
import { groupWithLeave, weekTitle } from "../../lib/shift-groups";
import type { LeaveClamp } from "../../lib/shift-groups";
import type { Shift } from "../../lib/shifts-api";
import { LoadBoundary } from "../LoadBoundary";
import { PeriodNavigator } from "../PeriodNavigator";
import { EmptyState } from "../ui/EmptyState";
import { SegmentedControl } from "../ui/SegmentedControl";
import { STICKY_ON_PHONE } from "../ui/sticky-on-phone";
import { ShiftGroup } from "./ShiftGroup";

type Tab = "upcoming" | "history";

const TAB_OPTIONS: { value: Tab; label: string }[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "history", label: "History" },
];

interface LeaveHandlers {
  onEditLeave?: (leave: Leave) => void;
  onDeleteLeave?: (leave: Leave) => void;
}

interface ShiftsBlockProps extends LeaveHandlers {
  state: LoadState<Shift[]>;
  // Never holds the shifts back: until it is ready the list has no leave.
  leaveState: LoadState<Leave[]>;
  order: "oldest-first" | "newest-first";
  // History: the leave goes under the viewed week (see groupWithLeave).
  leaveClamp?: LeaveClamp;
  emptyMessage: string;
  today: string;
  highlightNext?: boolean;
  onEdit?: (shift: Shift) => void;
  onDelete?: (shift: Shift) => void;
}

const NO_LEAVE: Leave[] = [];

function ShiftsBlock({
  state,
  leaveState,
  order,
  leaveClamp,
  emptyMessage,
  today,
  highlightNext = false,
  onEdit,
  onDelete,
  onEditLeave,
  onDeleteLeave,
}: ShiftsBlockProps) {
  const leave = leaveState.status === "ready" ? leaveState.data : NO_LEAVE;
  return (
    <LoadBoundary state={state} noun="your shifts">
      {(shifts) =>
        shifts.length === 0 && leave.length === 0 ? (
          <EmptyState>{emptyMessage}</EmptyState>
        ) : (
          groupWithLeave(shifts, leave, order, leaveClamp).map((week) => (
            <ShiftGroup
              key={week.weekStart}
              title={weekTitle(week.weekStart, today, formatDateRange)}
              week={week}
              leave={week.leave}
              leaveDays={week.leaveDays}
              today={today}
              nextShiftId={highlightNext ? shifts[0]?.id : undefined}
              onEdit={onEdit}
              onDelete={onDelete}
              onEditLeave={onEditLeave}
              onDeleteLeave={onDeleteLeave}
            />
          ))
        )
      }
    </LoadBoundary>
  );
}

interface ShiftSectionsProps extends LeaveHandlers {
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
  onEditLeave,
  onDeleteLeave,
}: ShiftSectionsProps) {
  const [tab, setTab] = useState<Tab>("upcoming");

  return (
    <>
      <div className={STICKY_ON_PHONE}>
        <div className="mb-4 flex items-center justify-between gap-3 max-sm:mb-2">
          <SegmentedControl
            label="Shift period"
            options={TAB_OPTIONS}
            value={tab}
            onChange={setTab}
            fillOnPhone
          />
          {toolbarEnd}
        </div>
        {tab === "history" && (
          <PeriodNavigator
            className="mb-3 max-sm:mb-0"
            label={formatDateRange(lists.weekStart, lists.weekEnd)}
            unit="week"
            canGoNext={lists.canGoNext}
            onPrevious={lists.previousWeek}
            onNext={lists.nextWeek}
          />
        )}
      </div>

      {tab === "upcoming" ? (
        <section aria-label="Upcoming shifts">
          <ShiftsBlock
            state={lists.upcoming}
            leaveState={lists.upcomingLeave}
            order="oldest-first"
            emptyMessage="No upcoming shifts."
            today={lists.today}
            highlightNext
            onEdit={onEdit}
            onDelete={onDelete}
            onEditLeave={onEditLeave}
            onDeleteLeave={onDeleteLeave}
          />
        </section>
      ) : (
        <section aria-label="Shift history">
          <ShiftsBlock
            state={lists.history}
            leaveState={lists.historyLeave}
            order="newest-first"
            leaveClamp={{ weekStart: lists.weekStart, before: lists.today }}
            emptyMessage="No finished shifts in this week."
            today={lists.today}
            onEdit={onEdit}
            onDelete={onDelete}
            onEditLeave={onEditLeave}
            onDeleteLeave={onDeleteLeave}
          />
        </section>
      )}
    </>
  );
}
