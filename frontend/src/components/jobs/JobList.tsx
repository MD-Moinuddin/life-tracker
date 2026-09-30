import type { JobWithShiftCount } from "../../lib/jobs-api";
import { formatEuro } from "../../lib/money";
import { JOB_TYPE_LABELS } from "./job-types";

interface JobListProps {
  jobs: JobWithShiftCount[];
}

export function JobList({ jobs }: JobListProps) {
  if (jobs.length === 0) {
    return (
      <p className="text-slate-600">
        You have no jobs yet. Add your first one below.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
      {jobs.map((job) => (
        <li
          key={job.id}
          className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
        >
          <div>
            <p className="font-medium text-slate-900">{job.name}</p>
            <p className="text-sm text-slate-600">
              {JOB_TYPE_LABELS[job.type]}
            </p>
          </div>
          <p className="text-sm font-medium text-slate-900">
            {formatEuro(job.hourlyRate)} / hour
          </p>
        </li>
      ))}
    </ul>
  );
}
