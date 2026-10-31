import { classNames } from "../../lib/class-names";
import type { Leave } from "../../lib/leave-api";
import {
  isLeaveDayTaken,
  isLeavePlanned,
  leaveDayCents,
  leaveTotals,
} from "../../lib/leave-days";
import { pluralize } from "../../lib/plural";
import { formatCents } from "../../lib/shift-earnings";
import {
  formatDay,
  formatDuration,
  formatLeavePeriod,
} from "../../lib/shift-format";
import { DateTile } from "../shifts/DateTile";
import { ActionMenu } from "../ui/ActionMenu";
import type { ActionMenuItem } from "../ui/ActionMenu";
import { Icon } from "../ui/Icon";

interface LeaveRowBaseProps {
  leave: Leave;
  today: string;
  onEdit?: (leave: Leave) => void;
  onDelete?: (leave: Leave) => void;
}

// "period" shows the whole entry (with "Paid leave" and the job when
// `showJob`, as in the shift lists); "day" shows one counted `date` of it, as
// in the week agenda.
type LeaveRowProps = LeaveRowBaseProps &
  (
    | { variant: "period"; date?: undefined; showJob?: boolean }
    | { variant: "day"; date: string; showJob?: undefined }
  );

const MENU_SPACER = (
  <span aria-hidden="true" className="w-9 shrink-0 pointer-coarse:w-11" />
);

function actionsFor(
  leave: Leave,
  onEdit?: (leave: Leave) => void,
  onDelete?: (leave: Leave) => void,
): ActionMenuItem[] {
  const actions: ActionMenuItem[] = [];
  if (onEdit) {
    actions.push({ label: "Edit", onSelect: () => onEdit(leave) });
  }
  if (onDelete) {
    actions.push({
      label: "Delete…",
      tone: "danger",
      onSelect: () => onDelete(leave),
    });
  }
  return actions;
}

// One paid-leave entry (or one day of it) as a list row, with an Edit and
// Delete menu when handlers are given. Never colour alone: the sun icon, the
// words and a Taken or Planned label say what it is.
export function LeaveRow({
  leave,
  today,
  onEdit,
  onDelete,
  ...kind
}: LeaveRowProps) {
  const actions = actionsFor(leave, onEdit, onDelete);
  if (kind.variant === "day") {
    return (
      <LeaveDayRow
        leave={leave}
        date={kind.date}
        isPlanned={!isLeaveDayTaken(kind.date, today)}
        actions={actions}
      />
    );
  }

  const totals = leaveTotals(leave);
  const period = formatLeavePeriod(leave.startDate, leave.endDate);
  const isPlanned = isLeavePlanned(leave, today);
  const menuLabel = kind.showJob
    ? `Actions for paid leave, ${leave.job.name}, ${period}`
    : `Actions for paid leave ${period}`;

  return (
    <li className="flex items-center gap-3 border-l-4 border-leave-edge py-2.5 pr-1 pl-3 first:rounded-t-card last:rounded-b-card sm:pr-3 sm:pl-4">
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 font-semibold text-ink">
          <Icon name="sun" className="h-4 w-4 shrink-0 text-leave" />
          {period}
        </p>
        {kind.showJob && (
          <p className="text-sm font-medium text-leave-ink">{`Paid leave · ${leave.job.name}`}</p>
        )}
        <p className="text-sm text-ink-muted tabular-nums">
          {`${pluralize(totals.days, "day")} · ${formatDuration(totals.minutes)} · ${formatCents(totals.cents)}`}
        </p>
      </div>
      <span
        className={classNames(
          "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap",
          isPlanned
            ? "bg-leave-soft text-leave-ink"
            : "bg-neutral-soft text-ink-muted",
        )}
      >
        {isPlanned ? "Planned" : "Taken"}
      </span>
      {actions.length > 0 ? (
        <ActionMenu label={menuLabel} items={actions} />
      ) : (
        MENU_SPACER
      )}
    </li>
  );
}

// One counted day as an amber row with the date tile, in the shape of a
// ShiftRow: the job, "Paid leave · 4h counted" and the day's pay.
function LeaveDayRow({
  leave,
  date,
  isPlanned,
  actions,
}: {
  leave: Leave;
  date: string;
  isPlanned: boolean;
  actions: ActionMenuItem[];
}) {
  const cents = leaveDayCents(leave);
  const day = formatDay(date);

  return (
    <li className="flex items-center gap-3 border-l-4 border-leave-edge bg-leave-soft py-2.5 pr-1 pl-3 first:rounded-t-card last:rounded-b-card sm:gap-4 sm:py-3 sm:pr-3 sm:pl-4">
      <DateTile date={date} tone="leave" />
      <div className="min-w-0 flex-1">
        <p className="flex min-w-0 items-center gap-2 font-semibold text-ink">
          <Icon name="sun" className="h-4 w-4 shrink-0 text-leave" />
          <span className="truncate">{leave.job.name}</span>
        </p>
        <p className="text-sm text-leave-ink tabular-nums">
          <span className="sr-only">{`${day}, `}</span>
          <span>{`Paid leave · ${formatDuration(leave.minutesPerDay)} counted`}</span>
        </p>
      </div>
      <span
        className={classNames(
          "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap",
          isPlanned
            ? "bg-surface text-leave-ink"
            : "bg-neutral-soft text-ink-muted",
        )}
      >
        {isPlanned ? "Planned" : "Taken"}
      </span>
      <p className="font-semibold text-ink tabular-nums">
        {formatCents(cents)}
      </p>
      {actions.length > 0 ? (
        <ActionMenu
          label={`Actions for paid leave, ${leave.job.name}, ${day}`}
          items={actions}
        />
      ) : (
        MENU_SPACER
      )}
    </li>
  );
}
