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
});
