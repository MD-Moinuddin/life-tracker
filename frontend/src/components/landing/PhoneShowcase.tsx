import { classNames } from "../../lib/class-names";
import { JOB_COLORS } from "../../lib/job-color";
import { EYEBROW_ACCENT_CLASSES } from "../ui/eyebrow";
import { Icon } from "../ui/Icon";
import { PHONE_SHOWCASE } from "./landing-content";

// A static, made-up Shifts screen in a phone frame. Hidden from assistive
// tech: it is a picture of the app, not content.
function PhoneScreen() {
  const { shifts, tabs, activeTab } = PHONE_SHOWCASE;

  return (
    <div
      aria-hidden="true"
      className="relative mx-auto flex h-[31rem] w-64 flex-col overflow-hidden rounded-[2rem] border-8 border-ink bg-page shadow-2xl shadow-ink/30"
    >
      <div className="flex items-center justify-between border-b border-border bg-surface px-3.5 py-2.5 text-xs font-bold text-ink">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-accent" />
          Life Tracker
        </span>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-soft text-xs text-accent-ink">
          C
        </span>
      </div>
      <div className="flex-1 overflow-hidden px-3 py-2.5">
        <p className="mb-1.5 text-xl font-bold text-ink">Shifts</p>
        <p className="mb-1.5 text-[0.65rem] font-bold tracking-wider text-ink-muted uppercase">
          {PHONE_SHOWCASE.weekTitle}
        </p>
        <ul className="overflow-hidden rounded-control bg-surface">
          {shifts.map((shift) => (
            <li
              key={`${shift.day}-${shift.job}`}
              className={classNames(
                "flex items-center gap-2 border-b border-l-[3px] border-b-border py-1.5 pr-2 pl-2 last:border-b-0",
                JOB_COLORS[shift.colorIndex]?.edge,
              )}
            >
              <span className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-accent-soft text-[0.55rem] leading-tight font-semibold text-accent-ink">
                {shift.weekday}
                <strong className="text-sm">{shift.day}</strong>
              </span>
              <span className="min-w-0 flex-1 text-xs">
                <span className="flex items-center gap-1 font-semibold text-ink">
                  {shift.job}
                  {"label" in shift && (
                    <span className="rounded-full bg-accent px-1.5 text-[0.55rem] text-on-accent">
                      {shift.label}
                    </span>
                  )}
                </span>
                <span className="block text-[0.65rem] text-ink-muted">
                  {shift.time}
                </span>
              </span>
              <span className="text-xs font-bold text-ink">
                {shift.earnings}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <span className="absolute right-2.5 bottom-[4.2rem] rounded-full bg-accent px-3.5 py-2 text-xs font-semibold text-on-accent shadow-lg">
        {PHONE_SHOWCASE.fab}
      </span>
      <div className="flex border-t border-border bg-surface px-1 pt-1 pb-1.5">
        {tabs.map((tab) => (
          <span
            key={tab}
            className={classNames(
              "flex-1 text-center text-[0.6rem] font-medium",
              tab === activeTab ? "font-bold text-accent" : "text-ink-muted",
            )}
          >
            <span
              className={classNames(
                "mx-auto mb-0.5 block h-5 w-9 rounded-full",
                tab === activeTab && "bg-accent-soft",
              )}
            />
            {tab}
          </span>
        ))}
      </div>
    </div>
  );
}

export function PhoneShowcase() {
  return (
    <section
      aria-labelledby="phone-heading"
      className="grid items-center gap-10 pb-12 lg:grid-cols-[1fr_auto] lg:gap-16 lg:pb-16"
    >
      <div>
        <p className={`${EYEBROW_ACCENT_CLASSES} mb-2`}>
          {PHONE_SHOWCASE.eyebrow}
        </p>
        <h2
          id="phone-heading"
          className="text-3xl font-bold tracking-tight text-ink"
        >
          {PHONE_SHOWCASE.title}
        </h2>
        <p className="mt-2 max-w-xl text-lg text-ink-muted">
          {PHONE_SHOWCASE.lead}
        </p>
        <ul className="mt-5 grid gap-2.5 text-ink-muted">
          {PHONE_SHOWCASE.points.map((point) => (
            <li key={point} className="flex gap-2.5">
              <Icon
                name="check"
                className="mt-0.5 h-5 w-5 shrink-0 text-accent"
              />
              {point}
            </li>
          ))}
        </ul>
      </div>
      <PhoneScreen />
    </section>
  );
}
