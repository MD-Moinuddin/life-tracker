import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FeatureGrid } from "./FeatureGrid";
import {
  FEATURES,
  LANDING_FEATURES,
  LANDING_SECTION_IDS,
} from "./landing-content";

describe("FeatureGrid", () => {
  it("is a labelled section with the id the header links to", () => {
    render(<FeatureGrid />);

    expect(screen.getByRole("region", { name: FEATURES.title }).id).toBe(
      LANDING_SECTION_IDS.features,
    );
  });

  it("lists every feature with a heading and its description", () => {
    render(<FeatureGrid />);

    expect(screen.getAllByRole("listitem")).toHaveLength(
      LANDING_FEATURES.length,
    );
    for (const feature of LANDING_FEATURES) {
      expect(
        screen.getByRole("heading", { level: 3, name: feature.title }),
      ).toBeDefined();
      expect(screen.getByText(feature.description)).toBeDefined();
    }
  });

  it("gives every feature a decorative icon tile in its own tint", () => {
    const { container } = render(<FeatureGrid />);

    const tiles = container.querySelectorAll("li span[aria-hidden=true]");
    expect(tiles).toHaveLength(LANDING_FEATURES.length);
    for (const tile of tiles) {
      expect(tile.className).toMatch(/bg-job-\d\/12/);
      expect(tile.querySelector("svg")).not.toBeNull();
    }
  });
});
