import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { FinalCta } from "./FinalCta";
import { FINAL_CTA } from "./landing-content";

describe("FinalCta", () => {
  it("closes the page with a heading, a line and the two ways in", () => {
    render(
      <MemoryRouter>
        <FinalCta />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { level: 2, name: FINAL_CTA.title }),
    ).toBeDefined();
    expect(screen.getByText(FINAL_CTA.lead)).toBeDefined();
    expect(
      screen.getByRole("link", { name: "Sign up free" }).getAttribute("href"),
    ).toBe("/signup");
    expect(
      screen.getByRole("link", { name: "Log in" }).getAttribute("href"),
    ).toBe("/login");
  });

  it("offers the demo as a button, not a link, next to the sign-up links", () => {
    render(
      <MemoryRouter>
        <FinalCta />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: "Try the demo" })).toBeDefined();
    expect(screen.queryByRole("link", { name: "Try the demo" })).toBeNull();
  });
});
