import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { axe } from "jest-axe";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { logout } from "../../lib/auth-api";
import { endDemoSession } from "../../lib/demo/demo-session";
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
        <Route path="/" element={<p>Landing page</p>} />
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

describe("AppShell phone navigation", () => {
  it("fixes the one navigation to the bottom of a phone and leaves it in the header from md", () => {
    renderAt("/dashboard");

    const nav = screen.getByRole("navigation", { name: "Main" });
    for (const cls of [
      "max-md:fixed",
      "max-md:bottom-0",
      "max-md:h-tabbar",
      "md:flex-1",
    ]) {
      expect(nav.className).toContain(cls);
    }
    expect(screen.getAllByRole("navigation")).toHaveLength(1);
  });

  it("gives every link an icon above its label on a phone, hidden from md and from screen readers", () => {
    renderAt("/dashboard");

    for (const label of ["Dashboard", "Jobs", "Shifts", "Summary"]) {
      const link = screen.getByRole("link", { name: label });
      const icon = link.firstElementChild;
      expect(icon?.getAttribute("aria-hidden")).toBe("true");
      expect(icon?.className).toContain("md:hidden");
      expect(icon?.querySelector("svg")).not.toBeNull();
    }
  });

  it("draws a pill behind the icon of the current page only", () => {
    renderAt("/shifts");

    const pill = (label: string) =>
      screen.getByRole("link", { name: label }).firstElementChild?.className;
    expect(pill("Shifts")).toContain("bg-accent-soft");
    expect(pill("Jobs")).not.toContain("bg-accent-soft");
  });

  it("makes each tab at least 56px tall and a quarter of the bar wide", () => {
    renderAt("/dashboard");

    const link = screen.getByRole("link", { name: "Jobs" });
    expect(link.className).toContain("max-md:min-h-14");
    expect(link.className).toContain("max-md:w-full");
    expect(link.parentElement?.className).toContain("max-md:flex-1");
  });

  it("ends the page above the bar", () => {
    renderAt("/dashboard");

    expect(screen.getByRole("main").className).toContain(
      "max-md:pb-[calc(var(--spacing-tabbar)+2rem)]",
    );
  });
});

describe("AppShell layout", () => {
  it("shows the brand and the page content", () => {
    renderAt("/dashboard");

    expect(screen.getByText("Life Tracker")).toBeDefined();
    expect(screen.getByText("content")).toBeDefined();
  });

  it("links the brand to the dashboard", () => {
    renderAt("/shifts");

    const brand = screen.getByRole("link", { name: "Life Tracker" });
    expect(brand.getAttribute("href")).toBe("/dashboard");
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

  it("logs out through the API, clears the session and goes to the landing page", async () => {
    renderAt("/dashboard");
    fireEvent.click(screen.getByRole("button", { name: /Account menu/ }));

    fireEvent.click(screen.getByRole("button", { name: "Log out" }));

    expect(await screen.findByText("Landing page")).toBeDefined();
    expect(logout).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("still clears the session and leaves when the logout request fails", async () => {
    vi.mocked(logout).mockRejectedValue(new Error("network down"));
    renderAt("/dashboard");
    fireEvent.click(screen.getByRole("button", { name: /Account menu/ }));

    fireEvent.click(screen.getByRole("button", { name: "Log out" }));

    await waitFor(() => expect(screen.getByText("Landing page")).toBeDefined());
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

describe("AppShell demo", () => {
  const demoUser = {
    id: "demo-user",
    name: "Demo visitor",
    email: "",
    createdAt: "2026-01-01T00:00:00.000Z",
    isDemo: true,
  };

  function renderDemo() {
    useAuthStore.setState({ user: demoUser, accessToken: "demo" });
    return renderAt("/dashboard");
  }

  it("shows the demo banner, and none for a real user", () => {
    renderDemo();
    expect(screen.getByRole("region", { name: "Demo mode" })).toBeDefined();

    cleanup();
    useAuthStore.setState({ user, accessToken: "token" });
    renderAt("/dashboard");
    expect(screen.queryByRole("region", { name: "Demo mode" })).toBeNull();
  });

  it("leaves the demo to the landing page without calling the server", async () => {
    renderDemo();

    fireEvent.click(screen.getByRole("button", { name: "Exit demo" }));

    expect(await screen.findByText("Landing page")).toBeDefined();
    expect(useAuthStore.getState().user).toBeNull();
    expect(logout).not.toHaveBeenCalled();
  });

  it("leaves the demo for the sign-up page from the banner", async () => {
    useAuthStore.setState({ user: demoUser, accessToken: "demo" });
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/signup" element={<p>Sign up page</p>} />
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

    fireEvent.click(screen.getByRole("button", { name: "Sign up" }));

    expect(await screen.findByText("Sign up page")).toBeDefined();
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("exits the demo from the account menu, with no logout request", async () => {
    renderDemo();

    fireEvent.click(screen.getByRole("button", { name: /Account menu/ }));
    const exits = screen.getAllByRole("button", { name: "Exit demo" });
    fireEvent.click(exits[exits.length - 1] as HTMLElement);

    expect(await screen.findByText("Landing page")).toBeDefined();
    expect(logout).not.toHaveBeenCalled();
    endDemoSession();
  });

  it("has no accessibility violations with the demo banner", async () => {
    const { container } = renderDemo();

    expect((await axe(container)).violations).toHaveLength(0);
  });
});
