import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { logout } from "../../lib/auth-api";
import { useAuthStore } from "../../store/auth-store";
import { AppShell } from "./AppShell";

vi.mock("../../lib/auth-api", () => ({ logout: vi.fn() }));

const user = {
  id: "user-1",
  name: "Md Moinuddin",
  email: "md@example.com",
  createdAt: "2026-10-01T09:00:00.000Z",
};

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<p>Login page</p>} />
        <Route
          path="*"
          element={
            <AppShell>
              <p>content</p>
            </AppShell>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(logout).mockResolvedValue(undefined);
  useAuthStore.setState({ user, accessToken: "token" });
});

afterEach(() => {
  useAuthStore.getState().clearAuth();
});

describe("AppShell navigation", () => {
  it.each([
    ["/dashboard", "Dashboard"],
    ["/jobs", "Jobs"],
    ["/shifts", "Shifts"],
    ["/summary", "Summary"],
  ])("marks the link of the current page (%s)", (path, label) => {
    renderAt(path);

    const link = screen.getByRole("link", { name: label });
    expect(link.getAttribute("aria-current")).toBe("page");
  });

  it("keeps a section active on its nested pages", () => {
    renderAt("/jobs/job-1");

    expect(
      screen.getByRole("link", { name: "Jobs" }).getAttribute("aria-current"),
    ).toBe("page");
  });

  it("marks no link on other pages", () => {
    renderAt("/somewhere-else");

    for (const label of ["Dashboard", "Jobs", "Shifts", "Summary"]) {
      const link = screen.getByRole("link", { name: label });
      expect(link.getAttribute("aria-current")).toBeNull();
    }
  });

  it("has one main navigation with the four links in order", () => {
    renderAt("/dashboard");

    const nav = screen.getByRole("navigation", { name: "Main" });
    const labels = Array.from(nav.querySelectorAll("a")).map(
      (link) => link.textContent,
    );
    expect(labels).toEqual(["Dashboard", "Jobs", "Shifts", "Summary"]);
  });

  it("underlines the current link as well as colouring it", () => {
    renderAt("/jobs");

    expect(screen.getByRole("link", { name: "Jobs" }).className).toContain(
      "border-accent",
    );
    expect(screen.getByRole("link", { name: "Shifts" }).className).toContain(
      "border-transparent",
    );
  });
});

describe("AppShell layout", () => {
  it("shows the brand and the page content", () => {
    renderAt("/dashboard");

    expect(screen.getByText("Life Tracker")).toBeDefined();
    expect(screen.getByText("content")).toBeDefined();
  });

  it("has a skip link that targets the main content", () => {
    renderAt("/dashboard");

    const skip = screen.getByRole("link", { name: "Skip to content" });
    expect(skip.getAttribute("href")).toBe("#main-content");
    expect(screen.getByRole("main").id).toBe("main-content");
  });
});

describe("AppShell account", () => {
  it("shows the signed-in user in the account menu", () => {
    renderAt("/dashboard");

    fireEvent.click(screen.getByRole("button", { name: /Account menu/ }));

    expect(screen.getByText("md@example.com")).toBeDefined();
  });

  it("logs out through the API, clears the session and goes to the login page", async () => {
    renderAt("/dashboard");
    fireEvent.click(screen.getByRole("button", { name: /Account menu/ }));

    fireEvent.click(screen.getByRole("button", { name: "Log out" }));

    expect(await screen.findByText("Login page")).toBeDefined();
    expect(logout).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("still clears the session and leaves when the logout request fails", async () => {
    vi.mocked(logout).mockRejectedValue(new Error("network down"));
    renderAt("/dashboard");
    fireEvent.click(screen.getByRole("button", { name: /Account menu/ }));

    fireEvent.click(screen.getByRole("button", { name: "Log out" }));

    await waitFor(() => expect(screen.getByText("Login page")).toBeDefined());
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("copes with a missing user", () => {
    useAuthStore.getState().clearAuth();
    renderAt("/dashboard");

    expect(
      screen.getByRole("button", { name: "Account menu: Account" }),
    ).toBeDefined();
  });
});

describe("AppShell accessibility", () => {
  it("has no violations with the account menu closed or open", async () => {
    const { container } = renderAt("/dashboard");
    expect((await axe(container)).violations).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: /Account menu/ }));
    expect((await axe(container)).violations).toHaveLength(0);
  });
});
