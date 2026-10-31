import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PHONE_SHOWCASE } from "./landing-content";
import { PhoneShowcase } from "./PhoneShowcase";

describe("PhoneShowcase", () => {
  it("has a heading, the lead and every point in real text", () => {
    render(<PhoneShowcase />);

    expect(
      screen.getByRole("heading", { level: 2, name: PHONE_SHOWCASE.title }),
    ).toBeDefined();
    expect(screen.getByText(PHONE_SHOWCASE.lead)).toBeDefined();
    for (const point of PHONE_SHOWCASE.points) {
      expect(screen.getByText(point)).toBeDefined();
    }
  });

  it("draws the phone as a picture: hidden from assistive tech", () => {
    const { container } = render(<PhoneShowcase />);

    const phone = container.querySelector(
      "[aria-hidden=true].rounded-\\[2rem\\]",
    );
    expect(phone).not.toBeNull();
    const text = phone?.textContent ?? "";
    expect(text).toContain("Shifts");
    expect(text).toContain(PHONE_SHOWCASE.weekTitle);
    expect(text).toContain("+ Add shift");
    for (const tab of PHONE_SHOWCASE.tabs) {
      expect(text).toContain(tab);
    }
  });

  it("shows every example shift with its time and earnings", () => {
    const { container } = render(<PhoneShowcase />);

    const text = container.textContent ?? "";
    for (const shift of PHONE_SHOWCASE.shifts) {
      expect(text).toContain(shift.time);
      expect(text).toContain(shift.earnings);
    }
  });
});
