import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MiniJobWarning } from "./MiniJobWarning";

describe("MiniJobWarning", () => {
  it("shows the planned amount and the threshold when the warning flag is true", () => {
    render(
      <MiniJobWarning
        miniJob={{
          plannedAmount: "540.01",
          threshold: "540.00",
          warning: true,
        }}
      />,
    );

    const status = screen.getByRole("status");
    expect(status.textContent).toContain("€540.01");
    expect(status.textContent).toContain("€540.00 threshold");
    expect(status.textContent).toContain("keep logging shifts");
  });

  it("shows nothing when the warning flag is false", () => {
    render(
      <MiniJobWarning
        miniJob={{
          plannedAmount: "540.00",
          threshold: "540.00",
          warning: false,
        }}
      />,
    );

    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("shows nothing without mini-job data, as in week view", () => {
    render(<MiniJobWarning />);

    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("shows the warning in the shared warning alert with a decorative icon", () => {
    const { container } = render(
      <MiniJobWarning
        miniJob={{
          plannedAmount: "600.00",
          threshold: "540.00",
          warning: true,
        }}
      />,
    );

    const alert = screen
      .getByText(/Mini-job warning\./)
      .closest(".bg-warning-soft");
    expect(alert).not.toBeNull();
    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe(
      "true",
    );
    expect(container.innerHTML).not.toMatch(/amber-|slate-|indigo-|red-/);
  });

  it("keeps the status region empty and without spacing when there is no warning", () => {
    render(
      <MiniJobWarning
        miniJob={{
          plannedAmount: "100.00",
          threshold: "540.00",
          warning: false,
        }}
      />,
    );

    const region = screen.getByRole("status");
    expect(region.textContent).toBe("");
    expect(region.className).not.toContain("mb-4");
  });

  it("spaces the region from what follows only while it shows a warning", () => {
    render(
      <MiniJobWarning
        miniJob={{
          plannedAmount: "600.00",
          threshold: "540.00",
          warning: true,
        }}
      />,
    );

    expect(screen.getByRole("status").className).toContain("mb-4");
  });
});
