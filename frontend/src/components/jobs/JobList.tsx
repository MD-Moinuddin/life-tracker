import { Link } from "react-router-dom";
import { classNames } from "../../lib/class-names";
import { jobColor } from "../../lib/job-color";
import type { JobWithShiftCount } from "../../lib/jobs-api";
import { formatEuro } from "../../lib/money";
import { pluralize } from "../../lib/plural";
import { jobPath } from "../../lib/routes";
import { tracksVacation } from "../../lib/vacation";
import { ActionMenu } from "../ui/ActionMenu";
import type { ActionMenuItem } from "../ui/ActionMenu";
import { cardClassName } from "../ui/Card";
import { JobTypeBadge } from "./JobTypeBadge";

interface JobListProps {
  jobs: JobWithShiftCount[];
  onEdit: (job: JobWithShiftCount) => void;
  onDelete: (job: JobWithShiftCount) => void;
  // Offered in the menu of a job that tracks paid vacation.
  onAddLeave?: (job: JobWithShiftCount) => void;
}

const CARD_CLASSES = classNames(
  "relative border-l-4 py-3 pr-2 pl-3.5 sm:py-4 sm:pl-4",
  "has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-accent",
);

// One card per job, in a grid that grows with the screen. The job's colour is
// the left edge and the monogram, the same colour its shifts and summary use.
export function JobList({ jobs, onEdit, onDelete, onAddLeave }: JobListProps) {
  function actionsFor(job: JobWithShiftCount): ActionMenuItem[] {
    return [
      { label: "Edit job", onSelect: () => onEdit(job) },
      ...(onAddLeave && tracksVacation(job)
        ? [{ label: "Add paid leave", onSelect: () => onAddLeave(job) }]
        : []),
      {
        label: "Delete job…",
        tone: "danger",
        onSelect: () => onDelete(job),
      },
    ];
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {jobs.map((job) => {
        const color = jobColor(job.id);
        return (
          <li
            key={job.id}
            className={cardClassName(
              "interactive",
              classNames(CARD_CLASSES, color.edge),
            )}
          >
            <div className="flex items-start gap-3">
              <div
                aria-hidden="true"
                className={classNames(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-lg font-bold",
                  color.tile,
                )}
              >
                {job.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  to={jobPath(job.id)}
                  className="block truncate text-lg font-semibold text-ink after:absolute after:inset-0 focus-visible:outline-none"
                >
                  {job.name}
                </Link>
                <JobTypeBadge type={job.type} />
              </div>
              <div className="relative z-10 -mt-1">
                <ActionMenu
                  label={`Actions for ${job.name}`}
                  items={actionsFor(job)}
                />
              </div>
            </div>
            <p className="mt-3 flex items-baseline justify-between gap-2 pr-2 max-sm:mt-2 max-sm:pl-14">
              <span>
                <span className="text-lg font-semibold text-ink tabular-nums sm:text-2xl">
                  {formatEuro(job.hourlyRate)}
                </span>
                <span className="text-sm text-ink-muted">{" / hour"}</span>
              </span>
              <span className="text-sm text-ink-muted">
                {pluralize(job.shiftCount, "shift")}
              </span>
            </p>
          </li>
        );
      })}
    </ul>
  );
}
