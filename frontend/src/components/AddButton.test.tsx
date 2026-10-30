import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AddButton } from "./AddButton";

describe("AddButton", () => {
  it("is named by its label", () => {
    render(<AddButton label="Add shift" onClick={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Add shift" })).toBeDefined();
  });

  it("calls onClick when pressed", () => {
    const onClick = vi.fn();
    render(<AddButton label="Add shift" onClick={onClick} />);

    fireEvent.click(screen.getByRole("button", { name: "Add shift" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("shows a decorative plus icon before the label", () => {
    const { container } = render(
      <AddButton label="Add shift" onClick={vi.fn()} />,
    );

    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe(
      "true",
    );
  });

  it("floats at the bottom right on a phone only when asked to", () => {
    const { unmount } = render(
      <AddButton label="Add job" onClick={() => {}} />,
    );
    expect(
      screen.getByRole("button", { name: "Add job" }).className,
    ).not.toContain("max-sm:fixed");
    unmount();

    render(<AddButton label="Add job" floating onClick={() => {}} />);
    const button = screen.getByRole("button", { name: "Add job" });
    expect(button.className).toContain("max-sm:fixed");
    expect(button.className).toContain("max-sm:rounded-full");
  });
});
