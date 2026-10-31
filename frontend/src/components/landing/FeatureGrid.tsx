import { classNames } from "../../lib/class-names";
import { JOB_COLORS } from "../../lib/job-color";
import { Card } from "../ui/Card";
import { Icon } from "../ui/Icon";
import {
  FEATURES,
  LANDING_FEATURES,
  LANDING_SECTION_IDS,
} from "./landing-content";
import { SectionIntro } from "./SectionIntro";

export function FeatureGrid() {
  return (
    <section
      id={LANDING_SECTION_IDS.features}
      aria-labelledby="features-heading"
      className="scroll-mt-20 pb-12 lg:pb-16"
    >
      <SectionIntro
        id="features-heading"
        eyebrow={FEATURES.eyebrow}
        title={FEATURES.title}
      />
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LANDING_FEATURES.map((feature) => (
          <li key={feature.title}>
            <Card padded className="h-full">
              <span
                aria-hidden="true"
                className={classNames(
                  "mb-3.5 flex h-11 w-11 items-center justify-center rounded-card",
                  JOB_COLORS[feature.colorIndex]?.tile,
                )}
              >
                <Icon name={feature.icon} className="h-6 w-6" />
              </span>
              <h3 className="font-semibold text-ink">{feature.title}</h3>
              <p className="mt-1 text-ink-muted">{feature.description}</p>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
