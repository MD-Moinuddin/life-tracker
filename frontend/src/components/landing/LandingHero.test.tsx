import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { LandingHero } from "./LandingHero";
import {
  LANDING_DESCRIPTION,
  LANDING_EYEBROW,
  LANDING_HEADLINE,
  LANDING_TRUST_POINTS,
} from "./landing-content";

function renderHero() {
  return render(
    <MemoryRouter>
      <LandingHero />
    </MemoryRouter>,
  );
}

describe("LandingHero", () => {
  it("has the headline as the page's only h1, with the eyebrow and description", () => {
    renderHero();

    expect(
      screen.getByRole("heading", { level: 1, name: LANDING_HEADLINE }),
    ).toBeDefined();
    expect(screen.getByText(LANDING_EYEBROW)).toBeDefined();
    expect(screen.getByText(LANDING_DESCRIPTION)).toBeDefined();
  });

  it("links Sign up free to /signup and Log in to /login", () => {
    renderHero();

    expect(
      screen.getByRole("link", { name: "Sign up free" }).getAttribute("href"),
    ).toBe("/signup");
    expect(
      screen.getByRole("link", { name: "Log in" }).getAttribute("href"),
    ).toBe("/login");
  });

  it("makes Sign up the primary button and Log in the quiet one", () => {
    renderHero();

    expect(
      screen.getByRole("link", { name: "Sign up free" }).className,
    ).toContain("bg-accent");
    expect(screen.getByRole("link", { name: "Log in" }).className).toContain(
      "border-border-strong",
    );
  });

  it("lists the trust points", () => {
    renderHero();

    const points = screen.getAllByRole("listitem");
    expect(points.map((point) => point.textContent)).toEqual([
      ...LANDING_TRUST_POINTS,
    ]);
    expect(
      within(points[0] as HTMLElement).getByText("Free to use"),
    ).toBeDefined();
  });

  it("offers the demo as a button, not a link, next to the sign-up links", () => {
    render(
      <MemoryRouter>
        <LandingHero />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: "Try the demo" })).toBeDefined();
    expect(screen.queryByRole("link", { name: "Try the demo" })).toBeNull();
  });
});
