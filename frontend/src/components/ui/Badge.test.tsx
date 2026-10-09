import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "./Badge";

describe("Badge", () => {
  it("shows its text", () => {
    render(<Badge>Mini-job</Badge>);

    expect(screen.getByText("Mini-job")).toBeDefined();
  });

  it("is neutral by default", () => {
    render(<Badge>Coming later</Badge>);

    expect(screen.getByText("Coming later").className).toContain(
      "bg-neutral-soft",
    );
  });

  it("has an accent and a success tone", () => {
    const { rerender } = render(<Badge tone="accent">A</Badge>);
    expect(screen.getByText("A").className).toContain("bg-accent-soft");

    rerender(<Badge tone="success">A</Badge>);
    expect(screen.getByText("A").className).toContain("bg-success-soft");
  });
});
