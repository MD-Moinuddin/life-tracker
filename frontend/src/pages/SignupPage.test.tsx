import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../lib/api-client";
import { login, signup } from "../lib/auth-api";
import { useAuthStore } from "../store/auth-store";
import { SignupPage } from "./SignupPage";

vi.mock("../lib/auth-api", () => ({ login: vi.fn(), signup: vi.fn() }));

const user = {
  id: "user-1",
  name: "Md Moinuddin",
  email: "md@example.com",
  createdAt: "2026-10-01T09:00:00.000Z",
};

function renderPage() {
  render(
    <MemoryRouter initialEntries={["/signup"]}>
      <Routes>
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<p>Login page</p>} />
        <Route path="/dashboard" element={<p>Dashboard page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

function signUpWith(name: string, email: string, password: string) {
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: name } });
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: email },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: password },
  });
  fireEvent.click(screen.getByRole("button", { name: "Sign up" }));
}

beforeEach(() => {
  vi.resetAllMocks();
});

afterEach(() => {
  useAuthStore.getState().clearAuth();
});

describe("SignupPage", () => {
  it("creates the account, logs in and opens the dashboard", async () => {
    vi.mocked(signup).mockResolvedValue(user);
    vi.mocked(login).mockResolvedValue({ accessToken: "token", user });
    renderPage();

    signUpWith("Md Moinuddin", "md@example.com", "Secret123");

    expect(await screen.findByText("Dashboard page")).toBeDefined();
    expect(signup).toHaveBeenCalledWith({
      name: "Md Moinuddin",
      email: "md@example.com",
      password: "Secret123",
    });
    expect(login).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().user).toEqual(user);
  });

  it("shows the server's message and does not log in when signup is rejected", async () => {
    vi.mocked(signup).mockRejectedValue(
      new ApiError(409, "Email is already registered"),
    );
    renderPage();

    signUpWith("Md Moinuddin", "md@example.com", "Secret123");

    const alert = await screen.findByText("Email is already registered");
    expect(alert.closest('[role="alert"]')).not.toBeNull();
    expect(login).not.toHaveBeenCalled();
    expect(screen.queryByText("Dashboard page")).toBeNull();
  });

  it("shows a generic message for any other failure", async () => {
    vi.mocked(signup).mockRejectedValue(new Error("network down"));
    renderPage();

    signUpWith("Md Moinuddin", "md@example.com", "Secret123");

    expect(await screen.findByText("Something went wrong")).toBeDefined();
  });

  it("links to the login page", () => {
    renderPage();

    const link = screen.getByRole("link", { name: "Log in" });
    expect(link.getAttribute("href")).toBe("/login");
  });

  it("invites the user to create an account with the page heading", () => {
    renderPage();

    expect(
      screen.getByRole("heading", { level: 1, name: "Create your account" }),
    ).toBeDefined();
  });
});
