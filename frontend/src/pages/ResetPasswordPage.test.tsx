import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../lib/api-client";
import { resetPassword } from "../lib/auth-api";
import { LoginPage } from "./LoginPage";
import { ResetPasswordPage } from "./ResetPasswordPage";

vi.mock("../lib/auth-api", () => ({ resetPassword: vi.fn(), login: vi.fn() }));

const INVALID_LINK = "This reset link is invalid or has expired.";

function renderPage(path = "/reset-password?token=abc123") {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<p>Forgot page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

function submitPassword(value: string) {
  fireEvent.change(screen.getByLabelText("New password"), {
    target: { value },
  });
  fireEvent.click(screen.getByRole("button", { name: "Set new password" }));
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("ResetPasswordPage", () => {
  it("shows the invalid-link message with a way to ask again when there is no token", () => {
    renderPage("/reset-password");

    expect(screen.getByText(INVALID_LINK)).toBeDefined();
    expect(
      screen
        .getByRole("link", { name: "Request a new link" })
        .getAttribute("href"),
    ).toBe("/forgot-password");
    expect(screen.queryByLabelText("New password")).toBeNull();
  });

  it("shows every broken password rule and does not submit", () => {
    renderPage();

    submitPassword("abc");

    expect(
      screen.getByText("Password must be at least 8 characters"),
    ).toBeDefined();
    expect(
      screen.getByText("Password must contain an uppercase letter"),
    ).toBeDefined();
    expect(screen.getByText("Password must contain a number")).toBeDefined();
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it("sets the password and lands on the login page with a notice", async () => {
    vi.mocked(resetPassword).mockResolvedValue(undefined);
    renderPage();

    submitPassword("GoodPassword1");

    expect(
      await screen.findByText(
        "Password updated. Log in with your new password.",
      ),
    ).toBeDefined();
    expect(
      screen.getByRole("heading", { level: 1, name: "Welcome back" }),
    ).toBeDefined();
    expect(resetPassword).toHaveBeenCalledWith({
      token: "abc123",
      password: "GoodPassword1",
    });
  });

  it("shows the invalid-link message when the server rejects the token", async () => {
    vi.mocked(resetPassword).mockRejectedValue(new ApiError(400, INVALID_LINK));
    renderPage();

    submitPassword("GoodPassword1");

    expect(await screen.findByText(INVALID_LINK)).toBeDefined();
    expect(
      screen.getByRole("link", { name: "Request a new link" }),
    ).toBeDefined();
    expect(screen.queryByLabelText("New password")).toBeNull();
  });

  it("shows a general error for any other failure and keeps the form", async () => {
    vi.mocked(resetPassword).mockRejectedValue(new Error("network down"));
    renderPage();

    submitPassword("GoodPassword1");

    expect(await screen.findByText("Something went wrong")).toBeDefined();
    expect(screen.getByLabelText("New password")).toBeDefined();
  });

  it("can show and hide the new password", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Show password" }));

    expect(screen.getByLabelText("New password").getAttribute("type")).toBe(
      "text",
    );
  });
});
