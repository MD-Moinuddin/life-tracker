import { Link } from "react-router-dom";
import { classNames } from "../../lib/class-names";
import type { JobWithShiftCount } from "../../lib/jobs-api";
import { formatEuro } from "../../lib/money";
import { pluralize } from "../../lib/plural";
import { jobPath } from "../../lib/routes";
import { Button } from "../ui/Button";
import { CARD_PADDING, cardClassName } from "../ui/Card";
import { JobTypeBadge } from "./JobTypeBadge";

interface JobListProps {
  jobs: JobWithShiftCount[];
  onEdit: (job: JobWithShiftCount) => void;
  onDelete: (job: JobWithShiftCount) => void;
}

const CARD_CLASSES = classNames(
  CARD_PADDING,
  "relative flex flex-wrap items-center justify-between gap-3",
  "has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-accent",
);

export function JobList({ jobs, onEdit, onDelete }: JobListProps) {
  return (
    <ul className="grid gap-3">
      {jobs.map((job) => (
        <li key={job.id} className={cardClassName("interactive", CARD_CLASSES)}>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={jobPath(job.id)}
                className="font-semibold text-ink after:absolute after:inset-0 focus-visible:outline-none"
              >
                {job.name}
              </Link>
              <JobTypeBadge type={job.type} />
            </div>
            <p className="mt-1 text-sm text-ink-muted">
              <span>{formatEuro(job.hourlyRate)} / hour</span>
              <span aria-hidden="true"> · </span>
              <span>{pluralize(job.shiftCount, "shift")}</span>
            </p>
          </div>
          <div className="relative z-10 flex gap-2">
            <Button
              variant="secondary"
              size="compact"
              onClick={() => onEdit(job)}
              aria-label={`Edit ${job.name}`}
            >
              Edit
            </Button>
            <Button
              variant="danger-outline"
              size="compact"
              onClick={() => onDelete(job)}
              aria-label={`Delete ${job.name}`}
            >
              Delete
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
