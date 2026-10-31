import { Card } from "../ui/Card";
import { HOW_IT_WORKS, LANDING_SECTION_IDS } from "./landing-content";
import { SectionIntro } from "./SectionIntro";

export function HowItWorks() {
  return (
    <section
      id={LANDING_SECTION_IDS.howItWorks}
      aria-labelledby="how-it-works-heading"
      className="scroll-mt-20 py-12 lg:py-16"
    >
      <SectionIntro
        id="how-it-works-heading"
        eyebrow={HOW_IT_WORKS.eyebrow}
        title={HOW_IT_WORKS.title}
        lead={HOW_IT_WORKS.lead}
      />
      <ol className="mt-8 grid gap-4 md:grid-cols-3">
        {HOW_IT_WORKS.steps.map((step, index) => (
          <li key={step.title}>
            <Card padded className="h-full">
              <span
                aria-hidden="true"
                className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft font-bold text-accent-ink"
              >
                {index + 1}
              </span>
              <h3 className="font-semibold text-ink">{step.title}</h3>
              <p className="mt-1 text-ink-muted">{step.description}</p>
            </Card>
          </li>
        ))}
      </ol>
    </section>
  );
}
