import { useCallback, useState } from "react";
import { AddButton } from "../components/AddButton";
import { ConfirmDelete } from "../components/ConfirmDelete";
import { AppShell } from "../components/layout/AppShell";
import { Modal } from "../components/Modal";
import { NoJobsNotice } from "../components/shifts/NoJobsNotice";
import { ShiftForm } from "../components/shifts/ShiftForm";
import { ShiftList } from "../components/shifts/ShiftList";
import { WeekNavigator } from "../components/shifts/WeekNavigator";
import { useLoad } from "../hooks/useLoad";
import type { LoadState } from "../hooks/useLoad";
import { addDays, hasEnded, localNow, weekBounds } from "../lib/dates";
import { listJobs } from "../lib/jobs-api";
import type { JobWithShiftCount } from "../lib/jobs-api";
import { formatDay, formatTimeRange } from "../lib/shift-format";
import {
  createShift,
  deleteShift,
  listShifts,
  updateShift,
} from "../lib/shifts-api";
import type { Shift, ShiftInput } from "../lib/shifts-api";

const MAX_PAGE_SIZE = 500;

interface ShiftsBlockProps {
  state: LoadState<Shift[]>;
  emptyMessage: string;
  onEdit: (shift: Shift) => void;
  onDelete: (shift: Shift) => void;
}

function ShiftsBlock({
  state,
  emptyMessage,
  onEdit,
  onDelete,
}: ShiftsBlockProps) {
  if (state.status === "loading") {
    return <p className="text-slate-600">Loading shifts…</p>;
  }
  if (state.status === "error") {
    return (
      <p role="alert" className="text-red-600">
        Could not load your shifts. Refresh the page to try again.
      </p>
    );
  }
  if (state.data.length === 0) {
    return <p className="text-slate-600">{emptyMessage}</p>;
  }
  return <ShiftList shifts={state.data} onEdit={onEdit} onDelete={onDelete} />;
}

interface ShiftDialogContentProps {
  jobs: LoadState<JobWithShiftCount[]>;
  initialValues?: ShiftInput;
  submitLabel: string;
  onSubmit: (values: ShiftInput) => Promise<void>;
  onClose: () => void;
}

function ShiftDialogContent({
  jobs,
  initialValues,
  submitLabel,
  onSubmit,
  onClose,
}: ShiftDialogContentProps) {
  if (jobs.status === "loading") {
    return <p className="text-slate-600">Loading jobs…</p>;
  }
  if (jobs.status === "error") {
    return (
      <p role="alert" className="text-red-600">
        Could not load your jobs. Close this dialog and try again.
      </p>
    );
  }
  if (jobs.data.length === 0) {
    return <NoJobsNotice onClose={onClose} />;
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

function toShiftInput(shift: Shift): ShiftInput {
  return {
    jobId: shift.jobId,
    date: shift.date,
    startTime: shift.startTime,
    endTime: shift.endTime,
    breakMinutes: shift.breakMinutes,
    notes: shift.notes,
  };
}

export function ShiftsPage() {
  const [now] = useState(localNow);
  const currentWeekStart = weekBounds(now.slice(0, 10)).from;
  const [weekStart, setWeekStart] = useState(currentWeekStart);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [deletingShift, setDeletingShift] = useState<Shift | null>(null);

  const loadJobs = useCallback(() => listJobs(), []);

  const loadUpcoming = useCallback(async () => {
    const page = await listShifts({
      from: addDays(now.slice(0, 10), -1),
      limit: MAX_PAGE_SIZE,
    });
    return page.items.filter((shift) => !hasEnded(shift, now));
  }, [now]);

  const loadHistory = useCallback(async () => {
    const page = await listShifts({
      from: weekStart,
      to: addDays(weekStart, 6),
      limit: MAX_PAGE_SIZE,
    });
    return page.items.filter((shift) => hasEnded(shift, now)).reverse();
  }, [weekStart, now]);

  const jobs = useLoad(loadJobs);
  const upcoming = useLoad(loadUpcoming);
  const history = useLoad(loadHistory);

  function reloadLists() {
    upcoming.reload();
    history.reload();
  }

  async function handleCreate(values: ShiftInput) {
    await createShift(values);
    setIsAddOpen(false);
    reloadLists();
  }

  async function handleUpdate(id: string, values: ShiftInput) {
    await updateShift(id, values);
    setEditingShift(null);
    reloadLists();
  }

  async function handleDelete(id: string) {
    await deleteShift(id);
    setDeletingShift(null);
    reloadLists();
  }

  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-slate-900">Shifts</h1>
        <AddButton label="Add shift" onClick={() => setIsAddOpen(true)} />
      </div>

      <section aria-labelledby="upcoming-heading" className="mb-8">
        <h2
          id="upcoming-heading"
          className="mb-3 text-lg font-medium text-slate-700"
        >
          Upcoming
        </h2>
        <ShiftsBlock
          state={upcoming.state}
          emptyMessage="No upcoming shifts."
          onEdit={setEditingShift}
          onDelete={setDeletingShift}
        />
      </section>

      <section aria-labelledby="history-heading">
        <h2
          id="history-heading"
          className="mb-3 text-lg font-medium text-slate-700"
        >
          History
        </h2>
        <WeekNavigator
          from={weekStart}
          to={addDays(weekStart, 6)}
          canGoNext={weekStart < currentWeekStart}
          onPrevious={() => setWeekStart(addDays(weekStart, -7))}
          onNext={() => setWeekStart(addDays(weekStart, 7))}
        />
        <ShiftsBlock
          state={history.state}
          emptyMessage="No finished shifts in this week."
          onEdit={setEditingShift}
          onDelete={setDeletingShift}
        />
      </section>

      <Modal
        open={isAddOpen}
        title="Add a shift"
        onClose={() => setIsAddOpen(false)}
      >
        {isAddOpen && (
          <ShiftDialogContent
            jobs={jobs.state}
            submitLabel="Add shift"
            onSubmit={handleCreate}
            onClose={() => setIsAddOpen(false)}
          />
        )}
      </Modal>

      <Modal
        open={editingShift !== null}
        title="Edit shift"
        onClose={() => setEditingShift(null)}
      >
        {editingShift && (
          <ShiftDialogContent
            jobs={jobs.state}
            initialValues={toShiftInput(editingShift)}
            submitLabel="Save changes"
            onSubmit={(values) => handleUpdate(editingShift.id, values)}
            onClose={() => setEditingShift(null)}
          />
        )}
      </Modal>

      <Modal
        open={deletingShift !== null}
        title="Delete shift?"
        onClose={() => setDeletingShift(null)}
      >
        {deletingShift && (
          <ConfirmDelete
            confirmLabel="Delete shift"
            onConfirm={() => handleDelete(deletingShift.id)}
            onCancel={() => setDeletingShift(null)}
          >
            <p>
              {`You are about to delete the ${deletingShift.job.name} shift on ${formatDay(deletingShift.date)}, ${formatTimeRange(deletingShift)}.`}
            </p>
            <p>This cannot be undone.</p>
          </ConfirmDelete>
        )}
      </Modal>
    </AppShell>
  );
}
