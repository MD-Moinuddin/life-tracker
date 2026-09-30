import type { JobWithShiftCount } from "../../lib/jobs-api";
import { formatEuro } from "../../lib/money";
import {
  COMPACT_BUTTON_CLASSES,
  COMPACT_DANGER_BUTTON_CLASSES,
} from "../form/form-styles";
import { JOB_TYPE_LABELS } from "./job-types";

interface JobListProps {
  jobs: JobWithShiftCount[];
  onEdit: (job: JobWithShiftCount) => void;
  onDelete: (job: JobWithShiftCount) => void;
}

export function JobList({ jobs, onEdit, onDelete }: JobListProps) {
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
          <div className="flex items-center gap-4">
            <p className="text-sm font-medium text-slate-900">
              {formatEuro(job.hourlyRate)} / hour
            </p>
            <button
              type="button"
              onClick={() => onEdit(job)}
              aria-label={`Edit ${job.name}`}
              className={COMPACT_BUTTON_CLASSES}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete(job)}
              aria-label={`Delete ${job.name}`}
              className={COMPACT_DANGER_BUTTON_CLASSES}
            >
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
