import { useId, useState } from "react";
import { useJobLeaveYears, useLeaveYear } from "../../hooks/useLeave";
import { useToast } from "../../hooks/useToast";
import { localNow } from "../../lib/dates";
import type { JobWithShiftCount } from "../../lib/jobs-api";
import { deleteLeave } from "../../lib/leave-api";
import type { Leave } from "../../lib/leave-api";
import { vacationBalance, vacationSettingOf } from "../../lib/vacation";
import { CONFIRM_DESCRIPTION_ID } from "../ConfirmDelete";
import { Modal } from "../Modal";
import { Alert } from "../ui/Alert";
import { Button } from "../ui/Button";
import { SectionHeading } from "../ui/SectionHeading";
import { AddLeaveDialog } from "./AddLeaveDialog";
import { DeleteLeaveConfirmation } from "./DeleteLeaveConfirmation";
import { LeaveList } from "./LeaveList";
import { VacationBalanceCard } from "./VacationBalanceCard";
import { YearStripCard, YearSwitch } from "./YearStrip";

interface VacationSectionProps {
  job: JobWithShiftCount;
  // Every loaded job, for the add and edit dialog.
  jobs: JobWithShiftCount[];
  // After leave is added, edited or deleted here (adding can remove shifts).
  onChanged?: () => void;
}

// The paid vacation of one job that tracks it: balance, year and booked
// leave. A failed leave request only affects this section.
export function VacationSection({
  job,
  jobs,
  onChanged,
}: VacationSectionProps) {
  const toast = useToast();
  const headingId = useId();
  const [today] = useState(() => localNow().slice(0, 10));
  const currentYear = Number(today.slice(0, 4));
  const [year, setYear] = useState(currentYear);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editing, setEditing] = useState<Leave | null>(null);
  const [deleting, setDeleting] = useState<Leave | null>(null);
  const { state, reload: reloadYear } = useLeaveYear(year);
  const { years: leaveYears, reload: reloadYears } = useJobLeaveYears(job.id);
  const reload = () => {
    reloadYear();
    reloadYears();
  };
  const reloadAfterChange = () => {
    reload();
    onChanged?.();
  };
  // The current year is always there; others only where the job has leave.
  // With leave in the current year alone there is nothing to choose.
  const choosable = [
    ...new Set([currentYear, year, ...(leaveYears ?? [])]),
  ].sort((a, b) => a - b);
  const hasChoice = leaveYears !== null && choosable.length > 1;

  async function handleDelete(id: string) {
    await deleteLeave(id);
    setDeleting(null);
    reloadAfterChange();
    toast.show("Paid leave deleted");
  }

  function closeDialog() {
    setIsAddOpen(false);
    setEditing(null);
  }

  return (
    <section aria-labelledby={headingId} className="mt-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHeading
          id={headingId}
        >{`Paid vacation ${year}`}</SectionHeading>
        <Button
          size="compact"
          variant="secondary"
          onClick={() => setIsAddOpen(true)}
        >
          Add paid leave
        </Button>
      </div>
      {hasChoice && (
        <YearSwitch year={year} years={choosable} onChange={setYear} />
      )}
      {state.status === "loading" && (
        <p className="text-ink-muted">Loading paid leave…</p>
      )}
      {state.status === "error" && (
        <Alert tone="danger" role="alert">
          <span className="block">Could not load paid leave.</span>
          <Button
            size="compact"
            variant="secondary"
            className="mt-2"
            onClick={reload}
          >
            Retry
          </Button>
        </Alert>
      )}
      {state.status === "ready" && (
        <LeaveContent
          job={job}
          year={year}
          today={today}
          leave={state.data.filter((entry) => entry.jobId === job.id)}
          onEdit={setEditing}
          onDelete={setDeleting}
        />
      )}

      <AddLeaveDialog
        open={isAddOpen || editing !== null}
        jobs={jobs}
        defaultJobId={job.id}
        editing={editing ?? undefined}
        today={today}
        onClose={closeDialog}
        onSaved={reloadAfterChange}
      />
      <Modal
        open={deleting !== null}
        title="Delete paid leave?"
        describedBy={CONFIRM_DESCRIPTION_ID}
        onClose={() => setDeleting(null)}
      >
        {deleting && (
          <DeleteLeaveConfirmation
            leave={deleting}
            onConfirm={() => handleDelete(deleting.id)}
            onCancel={() => setDeleting(null)}
          />
        )}
      </Modal>
    </section>
  );
}

interface LeaveContentProps {
  job: JobWithShiftCount;
  year: number;
  today: string;
  leave: Leave[];
  onEdit: (leave: Leave) => void;
  onDelete: (leave: Leave) => void;
}

function LeaveContent({
  job,
  year,
  today,
  leave,
  onEdit,
  onDelete,
}: LeaveContentProps) {
  const balance = vacationBalance({
    setting: vacationSettingOf(job),
    year,
    leave,
    today,
  });
  return (
    <>
      <VacationBalanceCard balance={balance} />
      <YearStripCard year={year} leave={leave} today={today} />
      {leave.length === 0 ? (
        <p className="text-ink-muted">{`No paid leave in ${year} yet`}</p>
      ) : (
        <LeaveList
          leave={leave}
          today={today}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
    </>
  );
}
