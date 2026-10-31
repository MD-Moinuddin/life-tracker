import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HowItWorks } from "./HowItWorks";
import { HOW_IT_WORKS, LANDING_SECTION_IDS } from "./landing-content";

describe("HowItWorks", () => {
  it("is a labelled section with the id the header links to", () => {
    render(<HowItWorks />);

    const section = screen.getByRole("region", { name: HOW_IT_WORKS.title });
    expect(section.id).toBe(LANDING_SECTION_IDS.howItWorks);
  });

  it("lists the three steps in order, each with a heading and a description", () => {
    render(<HowItWorks />);

    const steps = screen.getAllByRole("listitem");
    expect(steps).toHaveLength(3);
    HOW_IT_WORKS.steps.forEach((step, index) => {
      expect(steps[index]?.textContent).toContain(step.title);
      expect(steps[index]?.textContent).toContain(step.description);
      expect(
        screen.getByRole("heading", { level: 3, name: step.title }),
      ).toBeDefined();
    });
  });
});
