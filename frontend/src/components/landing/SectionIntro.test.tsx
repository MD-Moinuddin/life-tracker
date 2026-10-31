import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SectionIntro } from "./SectionIntro";

describe("SectionIntro", () => {
  it("shows the label, the heading and the lead", () => {
    render(<SectionIntro eyebrow="Label" title="Heading" lead="A line." />);

    expect(screen.getByText("Label")).toBeDefined();
    expect(
      screen.getByRole("heading", { level: 2, name: "Heading" }),
    ).toBeDefined();
    expect(screen.getByText("A line.")).toBeDefined();
  });

  it("leaves the lead out when there is none, and can name its heading", () => {
    render(<SectionIntro id="x" eyebrow="Label" title="Heading" />);

    expect(screen.getByRole("heading", { name: "Heading" }).id).toBe("x");
    expect(screen.queryByText("A line.")).toBeNull();
  });
});
