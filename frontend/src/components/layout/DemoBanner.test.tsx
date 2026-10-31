import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DemoBanner } from "./DemoBanner";

describe("DemoBanner", () => {
  it("says the data is made up and nothing is saved", () => {
    render(<DemoBanner onExit={vi.fn()} onSignUp={vi.fn()} />);

    const banner = screen.getByRole("region", { name: "Demo mode" });
    expect(banner.textContent).toContain("You are in the demo.");
    expect(banner.textContent).toContain("made up and nothing is saved");
  });

  it("offers Sign up as the main choice and Exit demo as the quiet one", () => {
    const onExit = vi.fn();
    const onSignUp = vi.fn();
    render(<DemoBanner onExit={onExit} onSignUp={onSignUp} />);

    const signUp = screen.getByRole("button", { name: "Sign up" });
    const exit = screen.getByRole("button", { name: "Exit demo" });
    expect(signUp.className).toContain("bg-accent");
    expect(exit.className).toContain("border-border-strong");

    fireEvent.click(signUp);
    fireEvent.click(exit);
    expect(onSignUp).toHaveBeenCalledTimes(1);
    expect(onExit).toHaveBeenCalledTimes(1);
  });
});
