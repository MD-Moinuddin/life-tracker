import type { LoadState } from "../../hooks/useLoad";
import type { JobWithShiftCount } from "../../lib/jobs-api";
import type { ShiftInput } from "../../lib/shifts-api";
import { LoadBoundary } from "../LoadBoundary";
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
  return (
    <LoadBoundary
      state={jobs}
      noun="your jobs"
      retryHint="Close this dialog and try again."
    >
      {(loadedJobs) =>
        loadedJobs.length === 0 ? (
          <NoJobsNotice onClose={onClose} />
        ) : (
          <ShiftForm
            jobs={loadedJobs}
            initialValues={initialValues}
            submitLabel={submitLabel}
            onSubmit={onSubmit}
            onCancel={onClose}
          />
        )
      }
    </LoadBoundary>
  );
}
