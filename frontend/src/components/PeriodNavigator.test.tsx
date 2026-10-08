import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PeriodNavigator } from "./PeriodNavigator";

function renderNavigator(canGoNext = true) {
  const onPrevious = vi.fn();
  const onNext = vi.fn();
  render(
    <PeriodNavigator
      label="5 Oct to 11 Oct 2026"
      unit="week"
      canGoNext={canGoNext}
      onPrevious={onPrevious}
      onNext={onNext}
    />,
  );
  return { onPrevious, onNext };
}

describe("PeriodNavigator", () => {
  it("shows the label", () => {
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

  it("names the buttons after the unit", () => {
    render(
      <PeriodNavigator
        label="Oct 2026"
        unit="month"
        onPrevious={vi.fn()}
        onNext={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Previous month" }),
    ).toBeDefined();
    expect(screen.getByRole("button", { name: "Next month" })).toBeDefined();
  });

  it("allows going forward by default", () => {
    render(
      <PeriodNavigator
        label="Oct 2026"
        unit="month"
        onPrevious={vi.fn()}
        onNext={vi.fn()}
      />,
    );

    const next = screen.getByRole("button", { name: "Next month" });
    expect((next as HTMLButtonElement).disabled).toBe(false);
  });
});
