import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FeatureList } from "./FeatureList";
import { LANDING_FEATURES } from "./landing-content";

describe("FeatureList", () => {
  it("lists the three features as a list", () => {
    render(<FeatureList />);

    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(LANDING_FEATURES).toHaveLength(3);
  });

  it("gives each feature a heading and its description", () => {
    render(<FeatureList />);

    for (const feature of LANDING_FEATURES) {
      expect(
        screen.getByRole("heading", { level: 2, name: feature.title }),
      ).toBeDefined();
      expect(screen.getByText(feature.description)).toBeDefined();
    }
  });
});
