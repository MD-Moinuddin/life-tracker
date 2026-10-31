import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { LandingHeader } from "./LandingHeader";
import { LANDING_SECTION_LINKS } from "./landing-content";

function renderHeader() {
  return render(
    <MemoryRouter>
      <LandingHeader />
    </MemoryRouter>,
  );
}

describe("LandingHeader", () => {
  it("is the page banner, with the brand linking home", () => {
    renderHeader();

    const banner = within(screen.getByRole("banner"));
    expect(
      banner.getByRole("link", { name: "Life Tracker" }).getAttribute("href"),
    ).toBe("/");
  });

  it("stays pinned to the top of the page", () => {
    renderHeader();

    expect(screen.getByRole("banner").className).toContain("sticky");
  });

  it("links to the sections of the page, from md up", () => {
    renderHeader();

    const nav = screen.getByRole("navigation", { name: "On this page" });
    expect(nav.className).toContain("max-md:hidden");
    for (const link of LANDING_SECTION_LINKS) {
      expect(
        within(nav)
          .getByRole("link", { name: link.label })
          .getAttribute("href"),
      ).toBe(`#${link.id}`);
    }
  });

  it("offers Log in and Sign up", () => {
    renderHeader();

    const nav = within(
      screen.getByRole("navigation", { name: "Sign in or create an account" }),
    );
    expect(nav.getByRole("link", { name: "Log in" }).getAttribute("href")).toBe(
      "/login",
    );
    expect(
      nav.getByRole("link", { name: "Sign up" }).getAttribute("href"),
    ).toBe("/signup");
  });
});
