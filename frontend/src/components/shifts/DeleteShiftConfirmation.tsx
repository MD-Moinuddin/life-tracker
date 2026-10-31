import type { Shift } from "../../lib/shifts-api";
import { ConfirmDelete } from "../ConfirmDelete";
import { cardClassName } from "../ui/Card";
import { ShiftRow } from "./ShiftRow";

interface DeleteShiftConfirmationProps {
  shift: Shift;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

// Shows the shift itself, as it appears in the list, so the visitor can see
// exactly what is about to go.
export function DeleteShiftConfirmation({
  shift,
  onConfirm,
  onCancel,
}: DeleteShiftConfirmationProps) {
  return (
    <ConfirmDelete
      confirmLabel="Delete shift"
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <p>This shift will be removed from your list and your totals.</p>
      <ul className={cardClassName("plain", "overflow-hidden")}>
        <ShiftRow shift={shift} today={shift.date} showRelativeDay={false} />
      </ul>
      <p>This cannot be undone.</p>
    </ConfirmDelete>
  );
}
