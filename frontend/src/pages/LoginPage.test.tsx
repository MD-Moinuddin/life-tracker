import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../lib/api-client";
import { login } from "../lib/auth-api";
import { useAuthStore } from "../store/auth-store";
import { LoginPage } from "./LoginPage";

vi.mock("../lib/auth-api", () => ({ login: vi.fn() }));

const user = {
  id: "user-1",
  name: "Md Moinuddin",
  email: "md@example.com",
  createdAt: "2026-10-01T09:00:00.000Z",
};

function renderPage() {
  render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<p>Signup page</p>} />
        <Route path="/dashboard" element={<p>Dashboard page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

function logInWith(email: string, password: string) {
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: email },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: password },
  });
  fireEvent.click(screen.getByRole("button", { name: "Log in" }));
}

beforeEach(() => {
  vi.resetAllMocks();
});

afterEach(() => {
  useAuthStore.getState().clearAuth();
});

describe("LoginPage", () => {
  it("logs in, stores the session and opens the dashboard", async () => {
    vi.mocked(login).mockResolvedValue({ accessToken: "token", user });
    renderPage();

    logInWith("md@example.com", "secret");

    expect(await screen.findByText("Dashboard page")).toBeDefined();
    expect(login).toHaveBeenCalledWith({
      email: "md@example.com",
      password: "secret",
    });
    expect(useAuthStore.getState().user).toEqual(user);
    expect(useAuthStore.getState().accessToken).toBe("token");
  });

  it("shows the server's message when the login is rejected", async () => {
    vi.mocked(login).mockRejectedValue(
      new ApiError(401, "Invalid email or password"),
    );
    renderPage();

    logInWith("md@example.com", "wrong");

    const alert = await screen.findByText("Invalid email or password");
    expect(alert.closest('[role="alert"]')).not.toBeNull();
    expect(screen.queryByText("Dashboard page")).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("shows a generic message for any other failure", async () => {
    vi.mocked(login).mockRejectedValue(new Error("network down"));
    renderPage();

    logInWith("md@example.com", "secret");

    expect(await screen.findByText("Something went wrong")).toBeDefined();
  });

  it("clears the previous error when trying again", async () => {
    let finish: (value: {
      accessToken: string;
      user: typeof user;
    }) => void = () => {};
    vi.mocked(login).mockRejectedValueOnce(
      new ApiError(401, "Invalid email or password"),
    );
    vi.mocked(login).mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    renderPage();
    logInWith("md@example.com", "wrong");
    await screen.findByText("Invalid email or password");

    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));

    await screen.findByRole("button", { name: /Logging in/ });
    expect(screen.queryByText("Invalid email or password")).toBeNull();

    finish({ accessToken: "token", user });

    expect(await screen.findByText("Dashboard page")).toBeDefined();
  });

  it("links to the signup page", () => {
    renderPage();

    const link = screen.getByRole("link", { name: "Sign up" });
    expect(link.getAttribute("href")).toBe("/signup");
  });

  it("greets the user with the page heading", () => {
    renderPage();

    expect(
      screen.getByRole("heading", { level: 1, name: "Welcome back" }),
    ).toBeDefined();
  });
});
