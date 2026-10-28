import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { LANDING_HEADLINE } from "./components/landing/landing-content";
import { refresh } from "./lib/auth-api";
import { useAuthStore } from "./store/auth-store";

vi.mock("./lib/auth-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./lib/auth-api")>()),
  refresh: vi.fn(),
}));

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  // A visitor with no valid session cookie.
  vi.mocked(refresh).mockRejectedValue(new Error("no session"));
});

afterEach(() => {
  useAuthStore.setState({
    user: null,
    accessToken: null,
    isInitialized: false,
  });
});

describe("App routing for a logged-out visitor", () => {
  it("shows the landing page at /", async () => {
    renderAt("/");

    expect(
      await screen.findByRole("heading", { level: 1, name: LANDING_HEADLINE }),
    ).toBeDefined();
  });

  it("shows the landing page for an unknown URL", async () => {
    renderAt("/nope");

    expect(
      await screen.findByRole("heading", { level: 1, name: LANDING_HEADLINE }),
    ).toBeDefined();
  });

  it("still sends a protected page to the login form", async () => {
    renderAt("/summary");

    expect(
      await screen.findByRole("heading", { level: 1, name: "Welcome back" }),
    ).toBeDefined();
  });

  it("keeps /login and /signup working", async () => {
    const { unmount } = renderAt("/login");
    expect(
      await screen.findByRole("heading", { level: 1, name: "Welcome back" }),
    ).toBeDefined();
    unmount();

    renderAt("/signup");
    expect(await screen.findByRole("heading", { level: 1 })).toBeDefined();
  });

  it("shows the forgot password page", async () => {
    renderAt("/forgot-password");

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Reset your password",
      }),
    ).toBeDefined();
  });

  it("shows the reset password page, and an invalid-link message without a token", async () => {
    renderAt("/reset-password");

    expect(
      await screen.findByText("This reset link is invalid or has expired."),
    ).toBeDefined();
  });

  it("shows the new password form when the link has a token", async () => {
    renderAt("/reset-password?token=abc123");

    expect(await screen.findByLabelText("New password")).toBeDefined();
  });
});
