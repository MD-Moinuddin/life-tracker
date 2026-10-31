import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { LandingFooter } from "./LandingFooter";

describe("LandingFooter", () => {
  it("is the page's content info, with the brand, the links and the year", () => {
    render(
      <MemoryRouter>
        <LandingFooter />
      </MemoryRouter>,
    );

    const footer = within(screen.getByRole("contentinfo"));
    expect(footer.getByRole("link", { name: "Life Tracker" })).toBeDefined();
    const nav = within(footer.getByRole("navigation", { name: "Footer" }));
    expect(nav.getByRole("link", { name: "Log in" }).getAttribute("href")).toBe(
      "/login",
    );
    expect(
      nav.getByRole("link", { name: "Sign up" }).getAttribute("href"),
    ).toBe("/signup");
    expect(
      footer.getByText(`© ${new Date().getFullYear()} Life Tracker`),
    ).toBeDefined();
  });
});
