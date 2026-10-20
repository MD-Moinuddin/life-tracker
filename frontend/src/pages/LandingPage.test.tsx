import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import {
  LANDING_FEATURES,
  LANDING_HEADLINE,
} from "../components/landing/landing-content";
import { ROUTES } from "../lib/routes";
import { useAuthStore } from "../store/auth-store";
import { LandingPage } from "./LandingPage";

const user = {
  id: "user-1",
  name: "Md Moinuddin",
  email: "md@example.com",
  createdAt: "2026-10-01T09:00:00.000Z",
};

function renderLanding() {
  return render(
    <MemoryRouter initialEntries={[ROUTES.home]}>
      <Routes>
        <Route path={ROUTES.home} element={<LandingPage />} />
        <Route path={ROUTES.dashboard} element={<p>Dashboard page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  useAuthStore.setState({
    user: null,
    accessToken: null,
    isInitialized: false,
  });
});

describe("LandingPage when signed out", () => {
  it("shows the headline, the feature points and the product name", () => {
    useAuthStore.setState({ isInitialized: true });
    renderLanding();

    expect(
      screen.getByRole("heading", { level: 1, name: LANDING_HEADLINE }),
    ).toBeDefined();
    for (const feature of LANDING_FEATURES) {
      expect(
        screen.getByRole("heading", { level: 2, name: feature.title }),
      ).toBeDefined();
    }
    expect(
      within(screen.getByRole("banner")).getByText("Life Tracker"),
    ).toBeDefined();
  });

  it("offers Log in and Sign up in the header", () => {
    useAuthStore.setState({ isInitialized: true });
    renderLanding();

    const header = within(screen.getByRole("banner"));
    expect(
      header.getByRole("link", { name: "Log in" }).getAttribute("href"),
    ).toBe("/login");
    expect(
      header.getByRole("link", { name: "Sign up" }).getAttribute("href"),
    ).toBe("/signup");
  });

  it("offers Sign up and Log in in the hero", () => {
    useAuthStore.setState({ isInitialized: true });
    renderLanding();

    const main = within(screen.getByRole("main"));
    expect(
      main.getByRole("link", { name: "Sign up" }).getAttribute("href"),
    ).toBe("/signup");
    expect(
      main.getByRole("link", { name: "Log in" }).getAttribute("href"),
    ).toBe("/login");
  });

  it("uses a two-column hero from the lg breakpoint up and stacks below it", () => {
    useAuthStore.setState({ isInitialized: true });
    renderLanding();

    const hero = screen.getByRole("heading", { level: 1 }).closest("section");
    expect(hero?.className).toContain("lg:grid-cols-2");
  });
});

describe("LandingPage when signed in", () => {
  it("redirects to the dashboard", () => {
    useAuthStore.setState({ user, accessToken: "token", isInitialized: true });
    renderLanding();

    expect(screen.getByText("Dashboard page")).toBeDefined();
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
  });
});

describe("LandingPage before the session check finishes", () => {
  it("shows a loading status and none of the page", () => {
    renderLanding();

    expect(screen.getByRole("status").textContent).toContain("Loading");
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
    expect(screen.queryByText("Dashboard page")).toBeNull();
  });
});
