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
});
