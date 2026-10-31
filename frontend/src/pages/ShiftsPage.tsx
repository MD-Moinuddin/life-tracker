import { useCallback, useState } from "react";
import { AddButton } from "../components/AddButton";
import { CONFIRM_DESCRIPTION_ID } from "../components/ConfirmDelete";
import { AppShell } from "../components/layout/AppShell";
import { AddLeaveDialog } from "../components/leave/AddLeaveDialog";
import { DeleteLeaveConfirmation } from "../components/leave/DeleteLeaveConfirmation";
import { Modal } from "../components/Modal";
import { PageHeader } from "../components/ui/PageHeader";
import { DeleteShiftConfirmation } from "../components/shifts/DeleteShiftConfirmation";
import { ShiftDialogContent } from "../components/shifts/ShiftDialogContent";
import { ShiftSections } from "../components/shifts/ShiftSections";
import { WeekView } from "../components/shifts/WeekView";
import { Button } from "../components/ui/Button";
import { SegmentedControl } from "../components/ui/SegmentedControl";
import { useLoad } from "../hooks/useLoad";
import { useToast } from "../hooks/useToast";
import { useShiftLists } from "../hooks/useShiftLists";
import { listJobs } from "../lib/jobs-api";
import { deleteLeave } from "../lib/leave-api";
import type { Leave } from "../lib/leave-api";
import { createShift, deleteShift, updateShift } from "../lib/shifts-api";
import type { Shift, ShiftInput } from "../lib/shifts-api";
import { tracksVacation } from "../lib/vacation";

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
  const toast = useToast();
  const [view, setView] = useState<View>("list");
  // Count shift and leave changes, so the week view knows what to fetch again.
  const [version, setVersion] = useState(0);
  const [leaveVersion, setLeaveVersion] = useState(0);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [deletingShift, setDeletingShift] = useState<Shift | null>(null);
  const [isAddLeaveOpen, setIsAddLeaveOpen] = useState(false);
  const [editingLeave, setEditingLeave] = useState<Leave | null>(null);
  const [deletingLeave, setDeletingLeave] = useState<Leave | null>(null);

  const loadJobs = useCallback(() => listJobs(), []);
  const jobs = useLoad(loadJobs);
  const loadedJobs = jobs.state.status === "ready" ? jobs.state.data : null;
  const lists = useShiftLists(undefined, loadedJobs);
  const tracksAny = loadedJobs?.some((job) => tracksVacation(job)) ?? false;

  // A shift change never changes leave, so only the shifts fetch again.
  function reloadShifts() {
    lists.reloadShifts();
    setVersion((current) => current + 1);
  }

  // Shifts and leave together: booking leave can remove shifts.
  function reloadLeaveAndShifts() {
    reloadShifts();
    lists.reloadLeave();
    setLeaveVersion((current) => current + 1);
  }

  async function handleCreate(values: ShiftInput) {
    await createShift(values);
    setIsAddOpen(false);
    reloadShifts();
    toast.show("Shift added");
  }

  async function handleUpdate(id: string, values: ShiftInput) {
    await updateShift(id, values);
    setEditingShift(null);
    reloadShifts();
    toast.show("Shift updated");
  }

  async function handleDelete(id: string) {
    await deleteShift(id);
    setDeletingShift(null);
    reloadShifts();
    toast.show("Shift deleted");
  }

  async function handleDeleteLeave(id: string) {
    await deleteLeave(id);
    setDeletingLeave(null);
    reloadLeaveAndShifts();
    toast.show("Paid leave deleted");
  }

  function closeLeaveDialog() {
    setIsAddLeaveOpen(false);
    setEditingLeave(null);
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
          <div className="flex items-center gap-2">
            {tracksAny && (
              <Button
                size="compact"
                variant="secondary"
                className="max-sm:hidden"
                onClick={() => setIsAddLeaveOpen(true)}
              >
                Add paid leave
              </Button>
            )}
            <AddButton
              label="Add shift"
              floating
              onClick={() => setIsAddOpen(true)}
            />
          </div>
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
            onEditLeave={setEditingLeave}
            onDeleteLeave={setDeletingLeave}
          />
        ) : (
          <WeekView
            version={version}
            leaveVersion={leaveVersion}
            toolbarEnd={viewSwitch}
            jobs={loadedJobs}
            onEdit={setEditingShift}
            onDelete={setDeletingShift}
            onEditLeave={setEditingLeave}
            onDeleteLeave={setDeletingLeave}
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
        describedBy={CONFIRM_DESCRIPTION_ID}
        onClose={() => setDeletingShift(null)}
      >
        {deletingShift && (
          <DeleteShiftConfirmation
            shift={deletingShift}
            onConfirm={() => handleDelete(deletingShift.id)}
            onCancel={() => setDeletingShift(null)}
          />
        )}
      </Modal>

      {loadedJobs && (
        <AddLeaveDialog
          open={isAddLeaveOpen || editingLeave !== null}
          jobs={loadedJobs}
          editing={editingLeave ?? undefined}
          today={lists.today}
          onClose={closeLeaveDialog}
          onSaved={reloadLeaveAndShifts}
        />
      )}
      <Modal
        open={deletingLeave !== null}
        title="Delete paid leave?"
        describedBy={CONFIRM_DESCRIPTION_ID}
        onClose={() => setDeletingLeave(null)}
      >
        {deletingLeave && (
          <DeleteLeaveConfirmation
            leave={deletingLeave}
            onConfirm={() => handleDeleteLeave(deletingLeave.id)}
            onCancel={() => setDeletingLeave(null)}
          />
        )}
      </Modal>
    </AppShell>
  );
}
