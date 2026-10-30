import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { classNames } from "../../lib/class-names";
import { ROUTES } from "../../lib/routes";
import { buttonClassName, Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Icon } from "../ui/Icon";
import { SectionHeading } from "../ui/SectionHeading";

interface GetStartedCardProps {
  hasJobs: boolean;
  onAddShift: () => void;
}

interface StepProps {
  number: number;
  title: string;
  hint?: string;
  done?: boolean;
  current?: boolean;
  action?: ReactNode;
}

function Step({ number, title, hint, done, current, action }: StepProps) {
  return (
    <li
      aria-current={current ? "step" : undefined}
      className={classNames(
        "flex items-center gap-3 rounded-card border px-3 py-2.5",
        current ? "border-accent bg-accent-soft/35" : "border-border",
      )}
    >
      <span
        aria-hidden="true"
        className={classNames(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold",
          done && "bg-accent text-on-accent",
          current && "bg-accent-soft text-accent-ink",
          !done && !current && "bg-neutral-soft text-ink-muted",
        )}
      >
        {done ? <Icon name="check" className="h-4 w-4" /> : number}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={classNames(
            "block font-semibold",
            done ? "text-ink-muted line-through" : "text-ink",
          )}
        >
          {title}
          {done && <span className="sr-only"> (done)</span>}
        </span>
        {hint && !done && (
          <span className="block text-sm text-ink-muted">{hint}</span>
        )}
      </span>
      {action}
    </li>
  );
}

// Shown until the user has a job and a shift: the three steps to a filled-in
// week, with the next one highlighted.
export function GetStartedCard({ hasJobs, onAddShift }: GetStartedCardProps) {
  return (
    <Card padded className="px-6">
      <SectionHeading>Let’s get you set up</SectionHeading>
      <p className="mt-0.5 mb-4 text-sm text-ink-muted">
        Three quick steps and your week fills in by itself.
      </p>
      <ol className="grid gap-2">
        <Step
          number={1}
          title="Add your first job"
          hint="Its name and hourly rate."
          done={hasJobs}
          current={!hasJobs}
          action={
            !hasJobs && (
              <Link
                to={ROUTES.jobs}
                className={buttonClassName("primary", "compact")}
              >
                Add job
              </Link>
            )
          }
        />
        <Step
          number={2}
          title="Add a shift"
          hint="Pick a job, a day and the times."
          current={hasJobs}
          action={
            hasJobs && (
              <Button size="compact" onClick={onAddShift}>
                Add shift
              </Button>
            )
          }
        />
        <Step
          number={3}
          title="See your summary"
          hint="Hours and earnings per job, by week or month."
        />
      </ol>
    </Card>
  );
}
