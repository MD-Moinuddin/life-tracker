import { useCallback } from "react";
import { useLoad } from "../../hooks/useLoad";
import type { JobWithShiftCount } from "../../lib/jobs-api";
import { pluralize } from "../../lib/plural";
import { formatCents } from "../../lib/shift-earnings";
import { formatDuration } from "../../lib/shift-format";
import { totalsOf } from "../../lib/shift-groups";
import { listShifts } from "../../lib/shifts-api";
import { ConfirmDelete } from "../ConfirmDelete";
import { Alert } from "../ui/Alert";

interface DeleteJobConfirmationProps {
  job: JobWithShiftCount;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

const MAX_PAGE_SIZE = 500;

function describeShifts(count: number) {
  if (count === 0) {
    return "This job has no shifts.";
  }
  return `Its ${pluralize(count, "logged shift")} will be deleted too.`;
}

// How much the job's shifts add up to, once they have loaded. The warning is
// already complete without it, so a slow or failed request costs nothing.
function ShiftImpact({ job }: { job: JobWithShiftCount }) {
  const load = useCallback(async () => {
    const page = await listShifts({ jobId: job.id, limit: MAX_PAGE_SIZE });
    return page.total > page.items.length ? null : page.items;
  }, [job.id]);
  const { state } = useLoad(load);

  if (state.status !== "ready" || state.data === null) {
    return null;
  }
  const totals = totalsOf(state.data);
  return (
    <ul className="mt-1 list-disc pl-5">
      <li>{`${formatCents(totals.cents)} of earnings`}</li>
      <li>{`${formatDuration(totals.minutes)} of logged hours`}</li>
    </ul>
  );
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
      {job.shiftCount === 0 ? (
        <p>{describeShifts(0)}</p>
      ) : (
        <Alert tone="warning">
          <span className="block">{describeShifts(job.shiftCount)}</span>
          <ShiftImpact job={job} />
        </Alert>
      )}
      <p>This cannot be undone.</p>
    </ConfirmDelete>
  );
}
