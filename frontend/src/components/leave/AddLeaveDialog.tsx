import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLeaveYear } from "../../hooks/useLeave";
import { useLoad } from "../../hooks/useLoad";
import { useToast } from "../../hooks/useToast";
import { localNow } from "../../lib/dates";
import type { JobWithShiftCount } from "../../lib/jobs-api";
import { createLeave, updateLeave } from "../../lib/leave-api";
import type { Leave, LeaveInput } from "../../lib/leave-api";
import { isBookableRange } from "../../lib/leave-validation";
import { pluralize } from "../../lib/plural";
import { ROUTES } from "../../lib/routes";
import { listShifts } from "../../lib/shifts-api";
import type { Shift } from "../../lib/shifts-api";
import { tracksVacation } from "../../lib/vacation";
import { Modal } from "../Modal";
import { Button, buttonClassName } from "../ui/Button";
import { DialogBody } from "../ui/DialogParts";
import { LeaveForm } from "./LeaveForm";
import type { LeaveRange } from "./LeaveForm";

// The API's largest page. A booking is at most one year, and its shifts fit.
const MAX_PAGE_SIZE = 500;
// How long the job and dates must stay put before their shifts are asked for,
// so picking a range costs one request, not one per change (the API allows
// 100 requests per 15 minutes).
const RANGE_SETTLE_MS = 300;
const NO_SHIFTS: Shift[] = [];

export type SavedLeave = Leave & { removedShifts?: number };

interface AddLeaveDialogProps {
  open: boolean;
  // Every loaded job; only those that track paid vacation are offered.
  jobs: JobWithShiftCount[];
  defaultJobId?: string;
  editing?: Leave;
  today?: string;
  onClose: () => void;
  // After a save, before the dialog closes (it then calls onClose).
  onSaved: (leave: SavedLeave) => void;
}

// Books paid leave, or edits an entry. The form asks for the job's shifts in
// the picked range (to warn about them) and the year's leave (for what is
// left); neither request blocks booking when it fails.
export function AddLeaveDialog({
  open,
  jobs,
  defaultJobId,
  editing,
  today,
  onClose,
  onSaved,
}: AddLeaveDialogProps) {
  return (
    <Modal
      open={open}
      title={editing ? "Edit paid leave" : "Add paid leave"}
      onClose={onClose}
    >
      {open && (
        <LeaveDialogContent
          key={editing?.id ?? "new"}
          jobs={jobs}
          defaultJobId={defaultJobId}
          editing={editing}
          today={today}
          onClose={onClose}
          onSaved={onSaved}
        />
      )}
    </Modal>
  );
}

function LeaveDialogContent({
  jobs,
  defaultJobId,
  editing,
  today: givenToday,
  onClose,
  onSaved,
}: Omit<AddLeaveDialogProps, "open">) {
  const toast = useToast();
  const [today] = useState(() => givenToday ?? localNow().slice(0, 10));
  const trackedJobs = jobs.filter((job) => tracksVacation(job));
  const range = useSettledRange();

  const bookable = range.value !== null && isBookableRange(range.value);
  // The year of the last bookable range, so a date being cleared or retyped
  // asks for no other year.
  const year = range.bookableYear ?? Number(today.slice(0, 4));
  const leaveYear = useLeaveYear(year, trackedJobs.length > 0);
  const shifts = useShiftsInRange(bookable ? range.value : null);
  // The loaded leave only counts for a From in the same year; until the year
  // of a new From has loaded, what is left is unknown.
  const fromYear = Number(range.latest?.startDate.slice(0, 4));
  const existingLeave =
    leaveYear.state.status === "ready" && fromYear === year
      ? leaveYear.state.data
      : undefined;

  if (trackedJobs.length === 0) {
    return (
      <DialogBody>
        <div className="space-y-4">
          <p className="text-sm text-ink">
            Turn on paid vacation for a job first.
          </p>
          <div className="flex gap-3">
            <Link to={ROUTES.jobs} className={buttonClassName("primary")}>
              Go to Jobs
            </Link>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogBody>
    );
  }

  async function handleSubmit(input: LeaveInput) {
    if (editing) {
      // The form leaves out removeOverlappingShifts when editing.
      const updated = await updateLeave(editing.id, input);
      toast.show("Paid leave updated");
      onSaved(updated);
    } else {
      const created = await createLeave(input);
      const removed = created.removedShifts ?? 0;
      toast.show(
        removed > 0
          ? `Paid leave added · ${pluralize(removed, "shift")} removed`
          : "Paid leave added",
      );
      onSaved(created);
    }
    onClose();
  }

  return (
    <LeaveForm
      jobs={trackedJobs}
      defaultJobId={defaultJobId}
      initialValues={editing}
      existingLeave={existingLeave}
      shiftsInRange={shifts}
      today={today}
      onRangeChange={range.onChange}
      onSubmit={handleSubmit}
      onCancel={onClose}
    />
  );
}

// The form's job and dates: `latest` as they are now, `value` once they have
// stopped changing, and `bookableYear` the year of the last settled range that
// can be booked. The first range (the form as it opens) settles at once;
// later ones after RANGE_SETTLE_MS.
function useSettledRange() {
  const [latest, setLatest] = useState<LeaveRange | null>(null);
  const [value, setValue] = useState<LeaveRange | null>(null);
  const [bookableYear, setBookableYear] = useState<number | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const hasValue = useRef(false);

  const onChange = useCallback((next: LeaveRange) => {
    function settle() {
      setValue(next);
      if (isBookableRange(next)) {
        setBookableYear(Number(next.startDate.slice(0, 4)));
      }
    }
    setLatest(next);
    window.clearTimeout(timer.current);
    if (!hasValue.current) {
      hasValue.current = true;
      settle();
      return;
    }
    timer.current = window.setTimeout(settle, RANGE_SETTLE_MS);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return { latest, value, bookableYear, onChange };
}

// The job's shifts in a bookable range; none while there is no such range or
// when the request fails (the overlap warning is a help, not a check).
function useShiftsInRange(range: LeaveRange | null): Shift[] {
  const jobId = range?.jobId ?? "";
  const from = range?.startDate ?? "";
  const to = range?.endDate ?? "";
  const load = useCallback(async () => {
    if (jobId === "") {
      return NO_SHIFTS;
    }
    const page = await listShifts({ from, to, jobId, limit: MAX_PAGE_SIZE });
    return page.items;
  }, [jobId, from, to]);
  const { state } = useLoad(load, { keepPreviousData: true });
  return state.status === "ready" ? state.data : NO_SHIFTS;
}
