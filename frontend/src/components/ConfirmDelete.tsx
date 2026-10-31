import { useState, type ReactNode } from "react";
import { toErrorMessage } from "../lib/form-errors";
import { Alert } from "./ui/Alert";
import { Button } from "./ui/Button";
import { DialogBody, DialogFooter } from "./ui/DialogParts";

// The id of the text that says what will be deleted. The dialog points at it,
// so a screen reader reads the consequence along with the title. Only one
// confirmation is open at a time.
export const CONFIRM_DESCRIPTION_ID = "confirm-delete-description";

interface ConfirmDeleteProps {
  confirmLabel: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  children: ReactNode;
}

export function ConfirmDelete({
  confirmLabel,
  onConfirm,
  onCancel,
  children,
}: ConfirmDeleteProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setError(null);
    setIsDeleting(true);
    try {
      await onConfirm();
    } catch (caught) {
      setError(toErrorMessage(caught));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <DialogBody>
        <div className="space-y-4">
          {error && (
            <Alert tone="danger" role="alert">
              {error}
            </Alert>
          )}
          <div
            id={CONFIRM_DESCRIPTION_ID}
            className="space-y-3 text-sm text-ink"
          >
            {children}
          </div>
        </div>
      </DialogBody>
      <DialogFooter>
        <Button
          variant="secondary"
          onClick={onCancel}
          disabled={isDeleting}
          data-autofocus
        >
          Cancel
        </Button>
        <Button variant="danger" onClick={handleConfirm} loading={isDeleting}>
          {isDeleting ? "Deleting…" : confirmLabel}
        </Button>
      </DialogFooter>
    </>
  );
}
