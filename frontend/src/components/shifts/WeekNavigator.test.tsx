import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WeekNavigator } from "./WeekNavigator";

function renderNavigator(canGoNext = true) {
  const onPrevious = vi.fn();
  const onNext = vi.fn();
  render(
    <WeekNavigator
      from="2026-10-05"
      to="2026-10-11"
      canGoNext={canGoNext}
      onPrevious={onPrevious}
      onNext={onNext}
    />,
  );
  return { onPrevious, onNext };
}

describe("WeekNavigator", () => {
  it("shows the week range", () => {
    renderNavigator();

    expect(screen.getByText("5 Oct to 11 Oct 2026")).toBeDefined();
  });

  it("reports Previous week and Next week presses", () => {
    const { onPrevious, onNext } = renderNavigator();

    fireEvent.click(screen.getByRole("button", { name: "Previous week" }));
    fireEvent.click(screen.getByRole("button", { name: "Next week" }));

    expect(onPrevious).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("disables Next week when there is nothing later to show", () => {
    const { onNext } = renderNavigator(false);

    const next = screen.getByRole("button", { name: "Next week" });
    fireEvent.click(next);

    expect((next as HTMLButtonElement).disabled).toBe(true);
    expect(onNext).not.toHaveBeenCalled();
  });
});
