import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Alert } from "./Alert";

describe("Alert", () => {
  it("shows its message", () => {
    render(<Alert tone="info">You can keep logging shifts.</Alert>);

    expect(screen.getByText("You can keep logging shifts.")).toBeDefined();
  });

  it("shows a bold title before the message", () => {
    render(
      <Alert tone="warning" title="Mini-job warning.">
        Over the threshold.
      </Alert>,
    );

    expect(screen.getByText("Mini-job warning.").tagName).toBe("STRONG");
    expect(screen.getByText(/Over the threshold/)).toBeDefined();
  });

  it("has no live-region role unless one is given", () => {
    const { container } = render(<Alert tone="info">Hello</Alert>);

    expect(container.firstElementChild?.getAttribute("role")).toBeNull();
  });

  it("passes the role through", () => {
    render(
      <Alert tone="danger" role="alert">
        Could not save.
      </Alert>,
    );

    expect(screen.getByRole("alert").textContent).toContain("Could not save.");
  });

  it("is never colour alone: every tone has an icon that screen readers skip", () => {
    for (const tone of ["warning", "danger", "info"] as const) {
      const { container, unmount } = render(<Alert tone={tone}>x</Alert>);
      const icon = container.querySelector("svg");
      expect(icon).not.toBeNull();
      expect(icon?.getAttribute("aria-hidden")).toBe("true");
      unmount();
    }
  });

  it("uses the colours of its tone", () => {
    const { container, rerender } = render(<Alert tone="warning">x</Alert>);
    expect(container.firstElementChild?.className).toContain("bg-warning-soft");

    rerender(<Alert tone="danger">x</Alert>);
    expect(container.firstElementChild?.className).toContain("bg-danger-soft");

    rerender(<Alert tone="info">x</Alert>);
    expect(container.firstElementChild?.className).toContain("bg-accent-soft");
  });
});
