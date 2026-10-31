import { useId, useState } from "react";
import { formatEuro } from "../../lib/money";
import { EYEBROW_ACCENT_CLASSES } from "../ui/eyebrow";
import { ProgressBar } from "../ui/ProgressBar";
import { MINI_JOB_SPOTLIGHT, miniJobMessage } from "./landing-content";

const SPOTLIGHT = MINI_JOB_SPOTLIGHT;

// The one interactive example on the page: drag the planned earnings past the
// limit and the warning appears, as it does in the app.
export function MiniJobSpotlight() {
  const [planned, setPlanned] = useState<number>(SPOTLIGHT.initial);
  const sliderId = useId();
  const isOver = planned > SPOTLIGHT.limit;

  return (
    <section aria-labelledby="mini-job-heading" className="pb-12 lg:pb-16">
      <div className="grid items-center gap-8 rounded-3xl bg-linear-to-br from-accent to-accent-hover p-6 text-on-accent sm:p-10 lg:grid-cols-2 lg:gap-10">
        <div>
          <p className={`${EYEBROW_ACCENT_CLASSES} mb-2 text-accent-soft!`}>
            {SPOTLIGHT.eyebrow}
          </p>
          <h2
            id="mini-job-heading"
            className="text-3xl font-bold tracking-tight"
          >
            {SPOTLIGHT.title}
          </h2>
          <p className="mt-3 text-lg text-accent-soft">{SPOTLIGHT.lead}</p>
        </div>

        <div className="rounded-card bg-surface p-5 text-ink">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm text-ink-muted">{SPOTLIGHT.caption}</p>
            <p className="text-2xl font-bold tabular-nums">
              {formatEuro(planned.toFixed(2))}
            </p>
          </div>
          <ProgressBar
            value={planned}
            max={SPOTLIGHT.limit}
            label="Planned earnings against the example limit"
            valueText={`${formatEuro(planned.toFixed(2))} of ${formatEuro(SPOTLIGHT.limit.toFixed(2))}`}
            tone={isOver ? "warning" : "accent"}
            className="mt-3"
          />
          <p
            aria-live="polite"
            className={
              isOver
                ? "mt-3 rounded-control border border-warning-border bg-warning-soft px-3 py-2 text-sm font-semibold text-warning-ink"
                : "mt-3 rounded-control bg-accent-soft px-3 py-2 text-sm text-accent-ink"
            }
          >
            {miniJobMessage(planned, SPOTLIGHT.limit, formatEuro)}
          </p>
          <label htmlFor={sliderId} className="sr-only">
            {SPOTLIGHT.sliderLabel}
          </label>
          <input
            id={sliderId}
            type="range"
            min={SPOTLIGHT.min}
            max={SPOTLIGHT.max}
            step={SPOTLIGHT.step}
            value={planned}
            onChange={(event) => setPlanned(Number(event.target.value))}
            className="mt-4 w-full accent-accent"
          />
        </div>
      </div>
    </section>
  );
}
