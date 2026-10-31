import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import {
  FEATURES,
  HOW_IT_WORKS,
  LANDING_FEATURES,
  LANDING_HEADLINE,
  MINI_JOB_SPOTLIGHT,
  PHONE_SHOWCASE,
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
  it("shows the headline, every section and the product name", () => {
    useAuthStore.setState({ isInitialized: true });
    renderLanding();

    expect(
      screen.getByRole("heading", { level: 1, name: LANDING_HEADLINE }),
    ).toBeDefined();
    for (const title of [
      HOW_IT_WORKS.title,
      FEATURES.title,
      MINI_JOB_SPOTLIGHT.title,
      PHONE_SHOWCASE.title,
      "Start tracking your shifts today",
    ]) {
      expect(
        screen.getByRole("heading", { level: 2, name: title }),
      ).toBeDefined();
    }
    for (const feature of LANDING_FEATURES) {
      expect(
        screen.getByRole("heading", { level: 3, name: feature.title }),
      ).toBeDefined();
    }
    expect(
      within(screen.getByRole("banner")).getByText("Life Tracker"),
    ).toBeDefined();
  });

  it("has exactly one h1", () => {
    useAuthStore.setState({ isInitialized: true });
    renderLanding();

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("ends with a footer", () => {
    useAuthStore.setState({ isInitialized: true });
    renderLanding();

    expect(screen.getByRole("contentinfo")).toBeDefined();
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

  it("offers Sign up free and Log in in the hero and again at the end", () => {
    useAuthStore.setState({ isInitialized: true });
    renderLanding();

    const main = within(screen.getByRole("main"));
    const signups = main.getAllByRole("link", { name: "Sign up free" });
    const logins = main.getAllByRole("link", { name: "Log in" });
    expect(signups).toHaveLength(2);
    expect(logins).toHaveLength(2);
    for (const link of signups) {
      expect(link.getAttribute("href")).toBe("/signup");
    }
    for (const link of logins) {
      expect(link.getAttribute("href")).toBe("/login");
    }
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
