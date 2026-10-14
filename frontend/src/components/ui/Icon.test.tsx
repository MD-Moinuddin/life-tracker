import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Icon } from "./Icon";

describe("Icon", () => {
  it("is hidden from screen readers by default", () => {
    const { container } = render(<Icon name="plus" />);

    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    expect(svg?.getAttribute("role")).toBeNull();
  });

  it("is exposed as an image with a label when it carries meaning", () => {
    render(<Icon name="warning" label="Warning" />);

    const icon = screen.getByRole("img", { name: "Warning" });
    expect(icon.getAttribute("aria-hidden")).toBeNull();
  });

  it("takes a size class and defaults to 20px", () => {
    const { container, rerender } = render(<Icon name="plus" />);
    expect(container.querySelector("svg")?.getAttribute("class")).toContain(
      "h-5 w-5",
    );

    rerender(<Icon name="plus" className="h-4 w-4" />);
    expect(container.querySelector("svg")?.getAttribute("class")).toContain(
      "h-4 w-4",
    );
  });

  it("draws something for every icon name", () => {
    const names = [
      "plus",
      "eye",
      "eye-off",
      "warning",
      "error",
      "info",
      "chevron-left",
      "chevron-right",
      "calendar",
      "activity",
      "leaf",
      "wallet",
    ] as const;

    for (const name of names) {
      const { container, unmount } = render(<Icon name={name} />);
      expect(container.querySelector("svg")?.childElementCount).toBeGreaterThan(
        0,
      );
      unmount();
    }
  });
});
