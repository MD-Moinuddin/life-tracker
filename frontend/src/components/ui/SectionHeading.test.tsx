import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SectionHeading } from "./SectionHeading";

describe("SectionHeading", () => {
  it("is a level 2 heading with the shared look", () => {
    render(<SectionHeading>Upcoming</SectionHeading>);

    const heading = screen.getByRole("heading", { level: 2, name: "Upcoming" });
    expect(heading.className).toContain("text-section");
    expect(heading.className).toContain("text-ink");
  });

  it("takes an id, so a section can be named by it", () => {
    render(<SectionHeading id="upcoming-heading">Upcoming</SectionHeading>);

    expect(screen.getByRole("heading").id).toBe("upcoming-heading");
  });

  it("sets no spacing of its own", () => {
    render(<SectionHeading>History</SectionHeading>);

    expect(screen.getByRole("heading").className).not.toMatch(
      /\b(m|mt|mb|my)-\d/,
    );
  });

  it("adds the caller's spacing", () => {
    render(<SectionHeading className="mb-3">History</SectionHeading>);

    expect(screen.getByRole("heading").className).toContain("mb-3");
  });
});
