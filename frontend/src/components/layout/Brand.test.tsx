import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Brand } from "./Brand";

describe("Brand", () => {
  it("shows the product name", () => {
    render(<Brand />);

    expect(screen.getByText("Life Tracker")).toBeDefined();
  });

  it("hides the decorative mark from screen readers", () => {
    const { container } = render(<Brand />);

    expect(
      container.querySelector("[aria-hidden='true']")?.className,
    ).toContain("bg-accent");
  });

  it("appends extra classes to the base look", () => {
    render(<Brand className="text-base" />);

    const brand = screen.getByText("Life Tracker");
    expect(brand.className).toContain("text-base");
    expect(brand.className).toContain("font-bold");
  });
});
