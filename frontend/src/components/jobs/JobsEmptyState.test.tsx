import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { JobsEmptyState } from "./JobsEmptyState";

describe("JobsEmptyState", () => {
  it("explains what jobs are for", () => {
    render(<JobsEmptyState onAdd={vi.fn()} />);

    expect(screen.getByText("No jobs yet")).toBeDefined();
    expect(screen.getByText(/log your shifts/)).toBeDefined();
  });

  it("offers an Add job button", () => {
    const onAdd = vi.fn();
    render(<JobsEmptyState onAdd={onAdd} />);

    fireEvent.click(screen.getByRole("button", { name: "Add job" }));

    expect(onAdd).toHaveBeenCalledTimes(1);
  });
});
