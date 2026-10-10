import { useState, type ReactNode } from "react";
import { toErrorMessage } from "../lib/form-errors";
import { Alert } from "./ui/Alert";
import { Button } from "./ui/Button";

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
    <div className="space-y-4">
      {error && (
        <Alert tone="danger" role="alert">
          {error}
        </Alert>
      )}

      <div className="space-y-2 text-sm text-ink">{children}</div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onCancel} disabled={isDeleting}>
          Cancel
        </Button>
        <Button variant="danger" onClick={handleConfirm} loading={isDeleting}>
          {isDeleting ? "Deleting…" : confirmLabel}
        </Button>
      </div>
    </div>
  );
}
