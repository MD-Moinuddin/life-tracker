import type { Leave } from "../../lib/leave-api";
import { leaveTotals } from "../../lib/leave-days";
import { pluralize } from "../../lib/plural";
import { formatCents } from "../../lib/shift-earnings";
import { formatDuration, formatLeavePeriod } from "../../lib/shift-format";
import { ConfirmDelete } from "../ConfirmDelete";
import { cardClassName } from "../ui/Card";

interface DeleteLeaveConfirmationProps {
  leave: Leave;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

// Names the period, so the visitor sees exactly what is about to go.
export function DeleteLeaveConfirmation({
  leave,
  onConfirm,
  onCancel,
}: DeleteLeaveConfirmationProps) {
  const totals = leaveTotals(leave);
  return (
    <ConfirmDelete
      confirmLabel="Delete paid leave"
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <p>This paid leave will be removed from your balance and your totals.</p>
      <div
        className={cardClassName(
          "plain",
          "border-l-4 border-leave-edge px-4 py-2",
        )}
      >
        <p className="font-semibold">
          {formatLeavePeriod(leave.startDate, leave.endDate)}
        </p>
        <p className="text-ink-muted">
          {`${pluralize(totals.days, "day")} · ${formatDuration(totals.minutes)} · ${formatCents(totals.cents)}`}
        </p>
      </div>
      <p>This cannot be undone.</p>
    </ConfirmDelete>
  );
}
