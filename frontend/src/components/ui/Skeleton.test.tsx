import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Skeleton } from "./Skeleton";

describe("Skeleton", () => {
  it("is hidden from screen readers and takes its size from the caller", () => {
    const { container } = render(<Skeleton className="h-4 w-1/2" />);

    const skeleton = container.firstElementChild;
    expect(skeleton?.getAttribute("aria-hidden")).toBe("true");
    expect(skeleton?.className).toContain("h-4 w-1/2");
  });

  it("only pulses for people who have not asked for less motion", () => {
    const { container } = render(<Skeleton />);

    expect(container.firstElementChild?.className).toContain(
      "motion-safe:animate-pulse",
    );
  });
});
