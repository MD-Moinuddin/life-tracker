import { useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { JobTypeBadge } from "../components/jobs/JobTypeBadge";
import { AppShell } from "../components/layout/AppShell";
import { LoadBoundary } from "../components/LoadBoundary";
import { ShiftSections } from "../components/shifts/ShiftSections";
import { EmptyState } from "../components/ui/EmptyState";
import { LINK_CLASSES } from "../components/ui/links";
import { PageHeader } from "../components/ui/PageHeader";
import { useLoad } from "../hooks/useLoad";
import type { LoadState } from "../hooks/useLoad";
import { useShiftLists } from "../hooks/useShiftLists";
import { classNames } from "../lib/class-names";
import { listJobs } from "../lib/jobs-api";
import type { JobWithShiftCount } from "../lib/jobs-api";
import { formatEuro } from "../lib/money";
import { ROUTES } from "../lib/routes";

function JobShifts({ jobId }: { jobId: string }) {
  const lists = useShiftLists(jobId);
  return <ShiftSections lists={lists} />;
}

interface JobContentProps {
  state: LoadState<JobWithShiftCount[]>;
  id: string;
}

function JobContent({ state, id }: JobContentProps) {
  return (
    <LoadBoundary state={state} noun="this job">
      {(jobs) => {
        const job = jobs.find((candidate) => candidate.id === id);
        if (!job) {
          return (
            <EmptyState>This job does not exist, or it was deleted.</EmptyState>
          );
        }
        return (
          <>
            <PageHeader
              title={job.name}
              subtitle={
                <span className="flex flex-wrap items-center gap-2">
                  <JobTypeBadge type={job.type} />
                  <span>{formatEuro(job.hourlyRate)} / hour</span>
                </span>
              }
            />
            <JobShifts jobId={job.id} />
          </>
        );
      }}
    </LoadBoundary>
  );
}

export function JobDetailPage() {
  const { id = "" } = useParams();
  const loadJobs = useCallback(() => listJobs(), []);
  const jobs = useLoad(loadJobs);

  return (
    <AppShell>
      <Link
        to={ROUTES.jobs}
        className={classNames(
          LINK_CLASSES,
          "mb-2 inline-flex min-h-11 items-center text-sm",
        )}
      >
        Back to jobs
      </Link>
      <JobContent state={jobs.state} id={id} />
    </AppShell>
  );
}
