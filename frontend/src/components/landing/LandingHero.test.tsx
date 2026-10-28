import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { LandingHero } from "./LandingHero";
import { LANDING_DESCRIPTION, LANDING_HEADLINE } from "./landing-content";

function renderHero() {
  return render(
    <MemoryRouter>
      <LandingHero />
    </MemoryRouter>,
  );
}

describe("LandingHero", () => {
  it("has the headline as the page's only h1, and the description", () => {
    renderHero();

    expect(
      screen.getByRole("heading", { level: 1, name: LANDING_HEADLINE }),
    ).toBeDefined();
    expect(screen.getByText(LANDING_DESCRIPTION)).toBeDefined();
  });

  it("links Sign up to /signup and Log in to /login", () => {
    renderHero();

    expect(
      screen.getByRole("link", { name: "Sign up" }).getAttribute("href"),
    ).toBe("/signup");
    expect(
      screen.getByRole("link", { name: "Log in" }).getAttribute("href"),
    ).toBe("/login");
  });
});
