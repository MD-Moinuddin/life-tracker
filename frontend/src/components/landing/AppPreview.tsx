import { JOB_COLORS } from "../../lib/job-color";
import { formatEuro } from "../../lib/money";
import { PLANNED_STYLE } from "../leave/planned-style";
import { Card } from "../ui/Card";
import { EYEBROW_CLASSES } from "../ui/eyebrow";
import { Icon } from "../ui/Icon";
import { ProgressBar } from "../ui/ProgressBar";
import { PREVIEW } from "./landing-content";

// The example jobs take the first two job colours, in order.
const [FIRST_COLOR, SECOND_COLOR] = JOB_COLORS;
const PREVIEW_COLORS = [FIRST_COLOR, SECOND_COLOR] as const;
const PERCENT_DONE = 32;
// The example vacation bar: the taken part, then the planned (hatched) part.
const VACATION_TAKEN = 40;
const VACATION_PLANNED = 15;

// A static, made-up week, drawn like the real Dashboard. It is hidden from
// assistive tech: the numbers are an example, not data.
export function AppPreview() {
  const { shift } = PREVIEW;

  return (
    <Card
      padded
      aria-hidden="true"
      className="mx-auto w-full max-w-md px-6 shadow-xl shadow-ink/10"
    >
      <div className="flex items-baseline justify-between">
        <p className={EYEBROW_CLASSES}>{PREVIEW.period}</p>
        <span className="text-xs text-ink-muted">{PREVIEW.caption}</span>
      </div>
      <p className="mt-1 text-4xl font-bold tracking-tight text-accent tabular-nums">
        {formatEuro(PREVIEW.earned)}
      </p>
      <p className="text-sm text-ink-muted">{PREVIEW.earnedDetail}</p>
      <ProgressBar
        value={PERCENT_DONE}
        max={100}
        label="Planned hours finished"
        className="mt-4"
      />
      <p className="mt-2 flex justify-between text-sm text-ink-muted">
        <span>
          <span className="font-semibold text-ink">{PREVIEW.percent}</span>
          {" of planned hours done"}
        </span>
        <span>{`${formatEuro(PREVIEW.plannedAmount)} · ${PREVIEW.plannedDetail}`}</span>
      </p>

      <div className="my-4 flex h-3 gap-0.5 overflow-hidden rounded-full bg-neutral-soft">
        {PREVIEW.jobs.map((job, index) => (
          <span
            key={job.name}
            className={PREVIEW_COLORS[index]?.dot}
            style={{ width: `${job.share}%` }}
          />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-4 text-sm text-ink">
        {PREVIEW.jobs.map((job, index) => (
          <li key={job.name} className="flex items-center gap-1.5">
            <span
              className={`h-2.5 w-2.5 rounded-sm ${PREVIEW_COLORS[index]?.dot}`}
            />
            {job.name}
            <span className="font-semibold">{`${job.share}%`}</span>
          </li>
        ))}
      </ul>

      <div className="mt-3">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-leave-ink">
          <Icon name="sun" className="h-4 w-4 shrink-0" />
          {`${PREVIEW.vacation.label}: ${PREVIEW.vacation.left} left of ${PREVIEW.vacation.of}`}
        </p>
        <div
          data-testid="vacation-bar"
          aria-hidden="true"
          className="mt-1.5 flex h-2 gap-0.5 overflow-hidden rounded-full bg-leave-soft"
        >
          <span className="bg-leave" style={{ width: `${VACATION_TAKEN}%` }} />
          <span
            data-planned=""
            style={{ ...PLANNED_STYLE, width: `${VACATION_PLANNED}%` }}
          />
        </div>
      </div>

      <div
        className={`mt-4 flex items-center gap-3 rounded-card border-l-4 bg-accent-soft/40 py-2.5 pr-3 pl-3.5 ${FIRST_COLOR.edge}`}
      >
        <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-control bg-accent-soft leading-tight text-accent-ink">
          <span className="text-xs font-semibold">{shift.weekday}</span>
          <span className="text-base font-bold">{shift.day}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 font-semibold text-ink">
            {shift.job}
            <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-on-accent">
              {shift.label}
            </span>
          </p>
          <p className="text-sm text-ink-muted">{shift.time}</p>
        </div>
        <p className="font-semibold text-ink">{formatEuro(shift.earnings)}</p>
      </div>
    </Card>
  );
}
