import { useCallback, useState } from "react";
import { AddButton } from "../components/AddButton";
import { ConfirmDelete } from "../components/ConfirmDelete";
import { AppShell } from "../components/layout/AppShell";
import { Modal } from "../components/Modal";
import { NoJobsNotice } from "../components/shifts/NoJobsNotice";
import { ShiftForm } from "../components/shifts/ShiftForm";
import { ShiftSections } from "../components/shifts/ShiftSections";
import { useLoad } from "../hooks/useLoad";
import type { LoadState } from "../hooks/useLoad";
import { useShiftLists } from "../hooks/useShiftLists";
import { listJobs } from "../lib/jobs-api";
import type { JobWithShiftCount } from "../lib/jobs-api";
import { formatDay, formatTimeRange } from "../lib/shift-format";
import { createShift, deleteShift, updateShift } from "../lib/shifts-api";
import type { Shift, ShiftInput } from "../lib/shifts-api";

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
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [deletingShift, setDeletingShift] = useState<Shift | null>(null);

  const loadJobs = useCallback(() => listJobs(), []);
  const jobs = useLoad(loadJobs);
  const lists = useShiftLists();

  async function handleCreate(values: ShiftInput) {
    await createShift(values);
    setIsAddOpen(false);
    lists.reload();
  }

  async function handleUpdate(id: string, values: ShiftInput) {
    await updateShift(id, values);
    setEditingShift(null);
    lists.reload();
  }

  async function handleDelete(id: string) {
    await deleteShift(id);
    setDeletingShift(null);
    lists.reload();
  }

  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-slate-900">Shifts</h1>
        <AddButton label="Add shift" onClick={() => setIsAddOpen(true)} />
      </div>

      <ShiftSections
        lists={lists}
        onEdit={setEditingShift}
        onDelete={setDeletingShift}
      />

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
