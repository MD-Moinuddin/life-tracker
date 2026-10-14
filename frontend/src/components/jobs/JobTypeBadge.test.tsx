import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { JobTypeBadge } from "./JobTypeBadge";

describe("JobTypeBadge", () => {
  it("shows a part-time job in the neutral tone", () => {
    render(<JobTypeBadge type="part_time" />);

    const badge = screen.getByText("Part-time job");
    expect(badge.className).toContain("bg-neutral-soft");
  });

  it("shows a mini-job in the accent tone", () => {
    render(<JobTypeBadge type="mini_job" />);

    const badge = screen.getByText("Mini-job");
    expect(badge.className).toContain("bg-accent-soft");
  });
});
