import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("shows its message", () => {
    render(<EmptyState>No shifts in this period.</EmptyState>);

    expect(screen.getByText("No shifts in this period.")).toBeDefined();
  });

  it("shows a title and an action when given", () => {
    render(
      <EmptyState
        title="No jobs yet"
        action={<button type="button">Add job</button>}
      >
        Add your first job to start tracking shifts.
      </EmptyState>,
    );

    expect(screen.getByText("No jobs yet")).toBeDefined();
    expect(screen.getByRole("button", { name: "Add job" })).toBeDefined();
  });

  it("shows a decorative icon when given", () => {
    const { container } = render(
      <EmptyState icon="calendar">Nothing here.</EmptyState>,
    );

    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe(
      "true",
    );
  });

  it("has no icon by default", () => {
    const { container } = render(<EmptyState>Nothing here.</EmptyState>);

    expect(container.querySelector("svg")).toBeNull();
  });
});
