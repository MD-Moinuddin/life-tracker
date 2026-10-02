import type { JobWithShiftCount } from "../../lib/jobs-api";
import { ConfirmDelete } from "../ConfirmDelete";

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
  return (
    <ConfirmDelete
      confirmLabel="Delete job"
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <p>
        You are about to delete <strong>{job.name}</strong>.
      </p>
      <p>{describeShifts(job.shiftCount)}</p>
      <p>This cannot be undone.</p>
    </ConfirmDelete>
  );
}
