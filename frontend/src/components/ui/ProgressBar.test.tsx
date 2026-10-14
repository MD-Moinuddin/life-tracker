import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProgressBar } from "./ProgressBar";

function fillOf(bar: HTMLElement): HTMLElement {
  return bar.firstElementChild as HTMLElement;
}

describe("ProgressBar", () => {
  it("is a progressbar named by its label", () => {
    render(<ProgressBar value={4} max={10} label="Hours worked" />);

    expect(
      screen.getByRole("progressbar", { name: "Hours worked" }),
    ).toBeDefined();
  });

  it("reports its value and range to assistive tech", () => {
    render(
      <ProgressBar
        value={480}
        max={1230}
        label="Hours"
        valueText="8h of 20h"
      />,
    );

    const bar = screen.getByRole("progressbar");
    expect(bar.getAttribute("aria-valuemin")).toBe("0");
    expect(bar.getAttribute("aria-valuemax")).toBe("1230");
    expect(bar.getAttribute("aria-valuenow")).toBe("480");
    expect(bar.getAttribute("aria-valuetext")).toBe("8h of 20h");
  });

  it("fills the bar to value over max", () => {
    render(<ProgressBar value={4} max={10} label="Hours worked" />);

    expect(fillOf(screen.getByRole("progressbar")).style.width).toBe("40%");
  });

  it("never reports a value above max", () => {
    render(<ProgressBar value={600} max={540} label="Limit" />);

    const bar = screen.getByRole("progressbar");
    expect(bar.getAttribute("aria-valuenow")).toBe("540");
    expect(fillOf(bar).style.width).toBe("100%");
  });

  it("draws an empty bar when max is zero", () => {
    render(<ProgressBar value={5} max={0} label="Hours worked" />);

    expect(fillOf(screen.getByRole("progressbar")).style.width).toBe("0%");
  });

  it("uses the accent colour by default", () => {
    render(<ProgressBar value={4} max={10} label="Hours worked" />);

    expect(fillOf(screen.getByRole("progressbar")).className).toContain(
      "bg-accent",
    );
  });

  it("uses the warning colour for the warning tone", () => {
    render(<ProgressBar value={9} max={10} label="Limit" tone="warning" />);

    expect(fillOf(screen.getByRole("progressbar")).className).toContain(
      "bg-warning",
    );
  });

  it("passes extra classes to the track", () => {
    render(<ProgressBar value={1} max={2} label="x" className="mt-3" />);

    expect(screen.getByRole("progressbar").className).toContain("mt-3");
  });
});
