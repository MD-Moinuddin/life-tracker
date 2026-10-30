import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { GetStartedCard } from "./GetStartedCard";

function renderCard(hasJobs: boolean, onAddShift = vi.fn()) {
  render(
    <MemoryRouter>
      <GetStartedCard hasJobs={hasJobs} onAddShift={onAddShift} />
    </MemoryRouter>,
  );
  return onAddShift;
}

describe("GetStartedCard", () => {
  it("lists the three steps in order", () => {
    renderCard(false);

    const steps = screen.getAllByRole("listitem");
    expect(steps).toHaveLength(3);
    expect(steps[0]?.textContent).toContain("Add your first job");
    expect(steps[1]?.textContent).toContain("Add a shift");
    expect(steps[2]?.textContent).toContain("See your summary");
  });

  it("starts with the job: a link to Jobs, and no shift button yet", () => {
    renderCard(false);

    expect(
      screen.getByRole("link", { name: "Add job" }).getAttribute("href"),
    ).toBe("/jobs");
    expect(screen.queryByRole("button", { name: "Add shift" })).toBeNull();
    expect(
      screen.getAllByRole("listitem")[0]?.getAttribute("aria-current"),
    ).toBe("step");
  });

  it("moves on to the shift once there is a job", () => {
    const onAddShift = renderCard(true);

    const steps = screen.getAllByRole("listitem");
    expect(steps[0]?.textContent).toContain("(done)");
    expect(steps[1]?.getAttribute("aria-current")).toBe("step");
    expect(screen.queryByRole("link", { name: "Add job" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Add shift" }));
    expect(onAddShift).toHaveBeenCalledTimes(1);
  });
});
