import { useCallback, useState } from "react";
import { AddButton } from "../components/AddButton";
import { ConfirmDelete } from "../components/ConfirmDelete";
import { AppShell } from "../components/layout/AppShell";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/ui/PageHeader";
import { ShiftDialogContent } from "../components/shifts/ShiftDialogContent";
import { ShiftSections } from "../components/shifts/ShiftSections";
import { WeekView } from "../components/shifts/WeekView";
import { SegmentedControl } from "../components/ui/SegmentedControl";
import { useLoad } from "../hooks/useLoad";
import { useShiftLists } from "../hooks/useShiftLists";
import { listJobs } from "../lib/jobs-api";
import { formatDay, formatTimeRange } from "../lib/shift-format";
import { createShift, deleteShift, updateShift } from "../lib/shifts-api";
import type { Shift, ShiftInput } from "../lib/shifts-api";

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

type View = "list" | "week";

const VIEW_OPTIONS = [
  { value: "list", label: "List", icon: "list" },
  { value: "week", label: "Week", icon: "calendar" },
] as const;

export function ShiftsPage() {
  const [view, setView] = useState<View>("list");
  // Counts changes, so the week view knows to fetch again.
  const [version, setVersion] = useState(0);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [deletingShift, setDeletingShift] = useState<Shift | null>(null);

  const loadJobs = useCallback(() => listJobs(), []);
  const jobs = useLoad(loadJobs);
  const lists = useShiftLists();

  function reloadShifts() {
    lists.reload();
    setVersion((current) => current + 1);
  }

  async function handleCreate(values: ShiftInput) {
    await createShift(values);
    setIsAddOpen(false);
    reloadShifts();
  }

  async function handleUpdate(id: string, values: ShiftInput) {
    await updateShift(id, values);
    setEditingShift(null);
    reloadShifts();
  }

  async function handleDelete(id: string) {
    await deleteShift(id);
    setDeletingShift(null);
    reloadShifts();
  }

  const viewSwitch = (
    <SegmentedControl
      label="View"
      options={VIEW_OPTIONS}
      value={view}
      onChange={setView}
    />
  );

  return (
    <AppShell>
      <PageHeader
        title="Shifts"
        action={
          <AddButton
            label="Add shift"
            floating
            onClick={() => setIsAddOpen(true)}
          />
        }
      />

      {/* Room at the bottom of a phone for the floating Add shift button. */}
      <div className="max-sm:pb-20">
        {view === "list" ? (
          <ShiftSections
            lists={lists}
            toolbarEnd={viewSwitch}
            onEdit={setEditingShift}
            onDelete={setDeletingShift}
          />
        ) : (
          <WeekView
            version={version}
            toolbarEnd={viewSwitch}
            onEdit={setEditingShift}
            onDelete={setDeletingShift}
          />
        )}
      </div>

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
