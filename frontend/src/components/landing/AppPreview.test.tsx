import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppPreview } from "./AppPreview";

describe("AppPreview", () => {
  it("is hidden from assistive tech, because its numbers are only an example", () => {
    const { container } = render(<AppPreview />);

    expect(container.firstElementChild?.getAttribute("aria-hidden")).toBe(
      "true",
    );
  });

  it("shows the example week, the split by job and the next shift", () => {
    const { container } = render(<AppPreview />);
    const text = container.textContent ?? "";

    expect(text).toContain("Example");
    expect(text).toContain("€174.00");
    expect(text).toContain("earned · 12h finished");
    expect(text).toContain("32% of planned hours done");
    expect(text).toContain("€549.00 · 37h 45m");
    expect(text).toContain("Cafe48%");
    expect(text).toContain("Restaurant52%");
    expect(text).toContain("10:45–16:00 · 5h 15m");
    expect(text).toContain("€73.50");
  });

  it("splits the bar by the example shares, in two different job colours", () => {
    const { container } = render(<AppPreview />);

    const parts = container.querySelectorAll<HTMLElement>(
      "div.rounded-full > span",
    );
    expect(Array.from(parts).map((part) => part.style.width)).toEqual([
      "48%",
      "52%",
    ]);
    expect(parts[0]?.className).not.toBe(parts[1]?.className);
  });
});
