import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MINI_JOB_SPOTLIGHT } from "./landing-content";
import { MiniJobSpotlight } from "./MiniJobSpotlight";

function slider() {
  return screen.getByLabelText(MINI_JOB_SPOTLIGHT.sliderLabel);
}

describe("MiniJobSpotlight", () => {
  it("starts under the limit, with how much is left", () => {
    render(<MiniJobSpotlight />);

    expect(screen.getByText("€420.00")).toBeDefined();
    expect(
      screen.getByText("€120.00 left before the limit of €540.00"),
    ).toBeDefined();
    const bar = screen.getByRole("progressbar");
    expect(bar.firstElementChild?.className).toContain("bg-accent");
  });

  it("has a labelled slider for the planned earnings", () => {
    render(<MiniJobSpotlight />);

    const range = slider() as HTMLInputElement;
    expect(range.type).toBe("range");
    expect(range.min).toBe(String(MINI_JOB_SPOTLIGHT.min));
    expect(range.max).toBe(String(MINI_JOB_SPOTLIGHT.max));
    expect(range.value).toBe(String(MINI_JOB_SPOTLIGHT.initial));
  });

  it("shows the warning, in the warning colour, once the limit is passed", () => {
    render(<MiniJobSpotlight />);

    fireEvent.change(slider(), { target: { value: "600" } });

    expect(
      screen.getByText(
        "Over the limit by €60.00. You can still change your plans.",
      ),
    ).toBeDefined();
    expect(
      screen.getByRole("progressbar").firstElementChild?.className,
    ).toContain("bg-warning");
  });

  it("takes the warning away again when the plans come back under the limit", () => {
    render(<MiniJobSpotlight />);
    fireEvent.change(slider(), { target: { value: "600" } });

    fireEvent.change(slider(), { target: { value: "300" } });

    expect(
      screen.getByText("€240.00 left before the limit of €540.00"),
    ).toBeDefined();
    expect(screen.queryByText(/Over the limit/)).toBeNull();
  });

  it("announces the change politely, and reads the bar as a value of the limit", () => {
    render(<MiniJobSpotlight />);

    expect(
      screen
        .getByText("€120.00 left before the limit of €540.00")
        .getAttribute("aria-live"),
    ).toBe("polite");
    expect(screen.getByRole("progressbar").getAttribute("aria-valuetext")).toBe(
      "€420.00 of €540.00",
    );
  });

  it("is a labelled section with its own heading", () => {
    render(<MiniJobSpotlight />);

    expect(
      screen.getByRole("heading", { level: 2, name: MINI_JOB_SPOTLIGHT.title }),
    ).toBeDefined();
  });
});
