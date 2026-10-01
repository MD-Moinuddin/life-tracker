import { useState } from "react";
import { toErrorMessage } from "../../lib/form-errors";
import type { JobWithShiftCount } from "../../lib/jobs-api";
import {
  DANGER_BUTTON_CLASSES,
  SECONDARY_BUTTON_CLASSES,
} from "../form/form-styles";
import { Spinner } from "../Spinner";

interface DeleteJobConfirmationProps {
  job: JobWithShiftCount;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

function describeShifts(count: number) {
  if (count === 0) {
    return "This job has no shifts.";
  }
  const noun = count === 1 ? "shift" : "shifts";
  return `Its ${count} logged ${noun} will be deleted too.`;
}

export function DeleteJobConfirmation({
  job,
  onConfirm,
  onCancel,
}: DeleteJobConfirmationProps) {
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

      <div className="space-y-2 text-sm text-slate-700">
        <p>
          You are about to delete <strong>{job.name}</strong>.
        </p>
        <p>{describeShifts(job.shiftCount)}</p>
        <p>This cannot be undone.</p>
      </div>

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
            "Delete job"
          )}
        </button>
      </div>
    </div>
  );
}
