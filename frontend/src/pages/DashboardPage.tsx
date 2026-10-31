import { useCallback, useState } from "react";
import { AddButton } from "../components/AddButton";
import { ComingSoonRow } from "../components/dashboard/ComingSoonRow";
import type { ComingSoonItem } from "../components/dashboard/ComingSoonRow";
import { GetStartedCard } from "../components/dashboard/GetStartedCard";
import { NextUpCard } from "../components/dashboard/NextUpCard";
import { WeekGlanceCard } from "../components/dashboard/WeekGlanceCard";
import { AppShell } from "../components/layout/AppShell";
import { Modal } from "../components/Modal";
import { ShiftDialogContent } from "../components/shifts/ShiftDialogContent";
import { PageHeader } from "../components/ui/PageHeader";
import { useLoad } from "../hooks/useLoad";
import { useToast } from "../hooks/useToast";
import { useUpcomingShifts } from "../hooks/useShiftLists";
import { useSummary } from "../hooks/useSummary";
import { greeting } from "../lib/greeting";
import { listJobs } from "../lib/jobs-api";
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

  const loadedJobs = jobs.state.status === "ready" ? jobs.state.data : null;
  const hasJobs = loadedJobs !== null && loadedJobs.length > 0;
  const hasShifts = loadedJobs?.some((job) => job.shiftCount > 0) ?? false;
  // Until there is a job and a shift, the set-up steps replace the empty cards.
  const isGettingStarted = loadedJobs !== null && !(hasJobs && hasShifts);

  async function handleCreate(values: ShiftInput) {
    await createShift(values);
    setIsAddOpen(false);
    toast.show("Shift added");
    summary.reload();
    upcoming.reload();
    jobs.reload();
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
    </AppShell>
  );
}
