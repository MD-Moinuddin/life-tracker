import { useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { JOB_TYPE_LABELS } from "../components/jobs/job-types";
import { AppShell } from "../components/layout/AppShell";
import { ShiftSections } from "../components/shifts/ShiftSections";
import { useLoad } from "../hooks/useLoad";
import type { LoadState } from "../hooks/useLoad";
import { useShiftLists } from "../hooks/useShiftLists";
import { listJobs } from "../lib/jobs-api";
import type { JobWithShiftCount } from "../lib/jobs-api";
import { formatEuro } from "../lib/money";

const LINK_CLASSES =
  "rounded text-sm font-medium text-indigo-600 hover:text-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600";

function JobShifts({ jobId }: { jobId: string }) {
  const lists = useShiftLists(jobId);
  return <ShiftSections lists={lists} />;
}

interface JobContentProps {
  state: LoadState<JobWithShiftCount[]>;
  id: string;
}

function JobContent({ state, id }: JobContentProps) {
  if (state.status === "loading") {
    return <p className="text-slate-600">Loading job…</p>;
  }
  if (state.status === "error") {
    return (
      <p role="alert" className="text-red-600">
        Could not load this job. Refresh the page to try again.
      </p>
    );
  }

  const job = state.data.find((candidate) => candidate.id === id);
  if (!job) {
    return (
      <p className="text-slate-600">
        This job does not exist, or it was deleted.
      </p>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-semibold text-slate-900">{job.name}</h1>
      <p className="mb-6 text-sm text-slate-600">
        {`${JOB_TYPE_LABELS[job.type]}, ${formatEuro(job.hourlyRate)} / hour`}
      </p>
      <JobShifts jobId={job.id} />
    </>
  );
}

export function JobDetailPage() {
  const { id = "" } = useParams();
  const loadJobs = useCallback(() => listJobs(), []);
  const jobs = useLoad(loadJobs);

  return (
    <AppShell>
      <Link to="/jobs" className={`${LINK_CLASSES} mb-4 inline-block`}>
        Back to jobs
      </Link>
      <JobContent state={jobs.state} id={id} />
    </AppShell>
  );
}
