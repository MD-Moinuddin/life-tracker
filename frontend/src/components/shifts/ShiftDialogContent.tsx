import type { LoadState } from "../../hooks/useLoad";
import type { JobWithShiftCount } from "../../lib/jobs-api";
import type { ShiftInput } from "../../lib/shifts-api";
import { LoadMessage } from "../LoadBoundary";
import { DialogBody } from "../ui/DialogParts";
import { NoJobsNotice } from "./NoJobsNotice";
import { ShiftForm } from "./ShiftForm";

interface ShiftDialogContentProps {
  jobs: LoadState<JobWithShiftCount[]>;
  initialValues?: ShiftInput;
  submitLabel: string;
  onSubmit: (values: ShiftInput) => Promise<void>;
  onClose: () => void;
}

// The inside of the add and edit shift dialogs: the form once the jobs have
// loaded, or a notice that a job is needed first.
export function ShiftDialogContent({
  jobs,
  initialValues,
  submitLabel,
  onSubmit,
  onClose,
}: ShiftDialogContentProps) {
  if (jobs.status !== "ready") {
    return (
      <DialogBody>
        <LoadMessage
          status={jobs.status}
          noun="your jobs"
          retryHint="Close this dialog and try again."
        />
      </DialogBody>
    );
  }

  if (jobs.data.length === 0) {
    return (
      <DialogBody>
        <NoJobsNotice onClose={onClose} />
      </DialogBody>
    );
  }

  return (
    <ShiftForm
      jobs={jobs.data}
      initialValues={initialValues}
      submitLabel={submitLabel}
      onSubmit={onSubmit}
      onCancel={onClose}
    />
  );
}
