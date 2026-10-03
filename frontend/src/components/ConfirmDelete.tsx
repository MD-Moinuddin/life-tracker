import { useState, type ReactNode } from "react";
import { toErrorMessage } from "../lib/form-errors";
import {
  DANGER_BUTTON_CLASSES,
  SECONDARY_BUTTON_CLASSES,
} from "./form/form-styles";
import { Spinner } from "./Spinner";

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
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <div className="space-y-2 text-sm text-slate-700">{children}</div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isDeleting}
          className={SECONDARY_BUTTON_CLASSES}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isDeleting}
          className={DANGER_BUTTON_CLASSES}
        >
          {isDeleting ? (
            <>
              <Spinner />
              Deleting…
            </>
          ) : (
            confirmLabel
          )}
        </button>
      </div>
    </div>
  );
}
