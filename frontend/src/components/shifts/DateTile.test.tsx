import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DateTile } from "./DateTile";

describe("DateTile", () => {
  it("shows the weekday over the day number", () => {
    render(<DateTile date="2026-10-03" />);

    expect(screen.getByText("Sat")).toBeDefined();
    expect(screen.getByText("3")).toBeDefined();
  });

  it("is decorative, because the row already says the full date", () => {
    const { container } = render(<DateTile date="2026-10-03" />);

    expect(container.firstElementChild?.getAttribute("aria-hidden")).toBe(
      "true",
    );
  });

  it("uses the accent tile colours", () => {
    const { container } = render(<DateTile date="2026-10-03" />);

    const { className } = container.firstElementChild as HTMLElement;
    expect(className).toContain("bg-accent-soft");
    expect(className).toContain("text-accent-ink");
  });

  it("uses the leave colours for a day of paid leave", () => {
    const { container } = render(<DateTile date="2026-10-03" tone="leave" />);

    const { className } = container.firstElementChild as HTMLElement;
    expect(className).toContain("bg-surface");
    expect(className).toContain("text-leave-ink");
    expect(className).not.toContain("bg-accent-soft");
  });
});
