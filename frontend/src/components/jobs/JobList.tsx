import { Link } from "react-router-dom";
import type { JobWithShiftCount } from "../../lib/jobs-api";
import { formatEuro } from "../../lib/money";
import { jobPath } from "../../lib/routes";
import {
  COMPACT_BUTTON_CLASSES,
  COMPACT_DANGER_BUTTON_CLASSES,
  LIST_CLASSES,
} from "../form/form-styles";
import { JOB_TYPE_LABELS } from "./job-types";

interface JobListProps {
  jobs: JobWithShiftCount[];
  onEdit: (job: JobWithShiftCount) => void;
  onDelete: (job: JobWithShiftCount) => void;
}

export function JobList({ jobs, onEdit, onDelete }: JobListProps) {
  return (
    <ul className={LIST_CLASSES}>
      {jobs.map((job) => (
        <li
          key={job.id}
          className="relative flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-slate-50 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:-outline-offset-2 has-[a:focus-visible]:outline-indigo-600"
        >
          <div>
            <Link
              to={jobPath(job.id)}
              className="font-medium text-slate-900 after:absolute after:inset-0 focus-visible:outline-none"
            >
              {job.name}
            </Link>
            <p className="text-sm text-slate-600">
              {JOB_TYPE_LABELS[job.type]}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm font-medium text-slate-900">
              {formatEuro(job.hourlyRate)} / hour
            </p>
            <div className="relative z-10 flex gap-2">
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
          </div>
        </li>
      ))}
    </ul>
  );
}
