import { useCallback, useState } from "react";
import { AddButton } from "../components/AddButton";
import { ComingSoonRow } from "../components/dashboard/ComingSoonRow";
import type { ComingSoonItem } from "../components/dashboard/ComingSoonRow";
import { GetStartedCard } from "../components/dashboard/GetStartedCard";
import { NextUpCard } from "../components/dashboard/NextUpCard";
import {
  VacationCard,
  VacationCardSkeleton,
} from "../components/dashboard/VacationCard";
import type { VacationRow } from "../components/dashboard/VacationCard";
import { WeekGlanceCard } from "../components/dashboard/WeekGlanceCard";
import { AppShell } from "../components/layout/AppShell";
import { Modal } from "../components/Modal";
import { AddLeaveDialog } from "../components/leave/AddLeaveDialog";
import type { SavedLeave } from "../components/leave/AddLeaveDialog";
import { ShiftDialogContent } from "../components/shifts/ShiftDialogContent";
import { PageHeader } from "../components/ui/PageHeader";
import { useLeaveYear } from "../hooks/useLeave";
import { useLoad } from "../hooks/useLoad";
import { useToast } from "../hooks/useToast";
import { useUpcomingShifts } from "../hooks/useShiftLists";
import { useSummary } from "../hooks/useSummary";
import { greeting } from "../lib/greeting";
import { isLeavePlanned } from "../lib/leave-days";
import { listJobs } from "../lib/jobs-api";
import {
  leaveOfTrackedJobs,
  tracksVacation,
  vacationBalance,
  vacationSettingOf,
} from "../lib/vacation";
import { formatLongDate } from "../lib/shift-format";
import { createShift } from "../lib/shifts-api";
import type { ShiftInput } from "../lib/shifts-api";
import { useAuthStore } from "../store/auth-store";

const COMING_SOON: ComingSoonItem[] = [
  { icon: "activity", title: "Fitness" },
  { icon: "leaf", title: "Nutrition" },
  { icon: "wallet", title: "Finance" },
];

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const toast = useToast();
  const summary = useSummary();
  const { now } = summary;
  const today = now.slice(0, 10);
  const upcoming = useUpcomingShifts(now);
  const loadJobs = useCallback(() => listJobs(), []);
  const jobs = useLoad(loadJobs);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);

  const loadedJobs = jobs.state.status === "ready" ? jobs.state.data : null;
  const hasJobs = loadedJobs !== null && loadedJobs.length > 0;
  const hasShifts = loadedJobs?.some((job) => job.shiftCount > 0) ?? false;
  // Until there is a job and a shift, the set-up steps replace the empty cards.
  const isGettingStarted = loadedJobs !== null && !(hasJobs && hasShifts);

  const year = Number(today.slice(0, 4));
  // Leave is asked for only when a job tracks paid vacation.
  const trackingJobs = (loadedJobs ?? []).filter((job) => tracksVacation(job));
  const leave = useLeaveYear(year, trackingJobs.length > 0);
  const yearLeave = leave.state.status === "ready" ? leave.state.data : null;
  const vacationRows: VacationRow[] | null =
    yearLeave !== null
      ? trackingJobs.map((job) => {
          const jobLeave = leaveOfTrackedJobs(yearLeave, [job]);
          const next = jobLeave
            .filter((entry) => isLeavePlanned(entry, today))
            .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
          return {
            job,
            balance: vacationBalance({
              setting: vacationSettingOf(job),
              year,
              leave: jobLeave,
              today,
            }),
            next,
          };
        })
      : null;

  async function handleCreate(values: ShiftInput) {
    await createShift(values);
    setIsAddOpen(false);
    toast.show("Shift added");
    summary.reload();
    upcoming.reload();
    jobs.reload();
  }

  // Leave counts in the week's figures, so the week reloads with it. Shifts
  // the booking removed also change what is next and the jobs' shift counts.
  function handleLeaveSaved(saved: SavedLeave) {
    leave.reload();
    summary.reload();
    if ((saved.removedShifts ?? 0) > 0) {
      upcoming.reload();
      jobs.reload();
    }
  }

  return (
    <AppShell>
      <PageHeader
        title={greeting(now, user?.name)}
        subtitle={formatLongDate(today)}
        action={
          hasJobs && !isGettingStarted ? (
            <AddButton
              label="Add shift"
              floating
              onClick={() => setIsAddOpen(true)}
            />
          ) : undefined
        }
      />

      {/* Room at the bottom of a phone for the floating Add shift button. */}
      <div className="max-sm:pb-20">
        {isGettingStarted ? (
          <GetStartedCard
            hasJobs={hasJobs}
            onAddShift={() => setIsAddOpen(true)}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-[1.15fr_1fr] md:items-start">
            <div className="max-md:order-2">
              <WeekGlanceCard state={summary.state} />
            </div>
            <div className="max-md:order-1">
              <NextUpCard state={upcoming.state} today={today} />
            </div>
            {trackingJobs.length > 0 && leave.state.status === "loading" && (
              <div className="max-md:order-3 md:col-span-2">
                <VacationCardSkeleton />
              </div>
            )}
            {vacationRows && vacationRows.length > 0 && (
              <div className="max-md:order-3 md:col-span-2">
                <VacationCard
                  rows={vacationRows}
                  onAddLeave={() => setIsLeaveOpen(true)}
                />
              </div>
            )}
          </div>
        )}
        <ComingSoonRow items={COMING_SOON} />
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
      <AddLeaveDialog
        open={isLeaveOpen}
        jobs={trackingJobs}
        onClose={() => setIsLeaveOpen(false)}
        onSaved={handleLeaveSaved}
      />
    </AppShell>
  );
}
