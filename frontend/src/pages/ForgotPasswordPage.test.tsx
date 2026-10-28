import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../lib/api-client";
import { forgotPassword } from "../lib/auth-api";
import { ForgotPasswordPage } from "./ForgotPasswordPage";

vi.mock("../lib/auth-api", () => ({ forgotPassword: vi.fn() }));

function renderPage() {
  render(
    <MemoryRouter initialEntries={["/forgot-password"]}>
      <Routes>
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/login" element={<p>Login page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

function requestLinkFor(email: string) {
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: email },
  });
  fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("ForgotPasswordPage", () => {
  it("has the page heading and a way back to log in", () => {
    renderPage();

    expect(
      screen.getByRole("heading", { level: 1, name: "Reset your password" }),
    ).toBeDefined();
    expect(
      screen.getByRole("link", { name: "Back to log in" }).getAttribute("href"),
    ).toBe("/login");
  });

  it("does not send an invalid email", () => {
    renderPage();

    requestLinkFor("not-an-email");

    expect(screen.getByText("Enter a valid email address")).toBeDefined();
    expect(forgotPassword).not.toHaveBeenCalled();
  });

  it("shows the confirmation after the request succeeds", async () => {
    vi.mocked(forgotPassword).mockResolvedValue({ message: "ok" });
    renderPage();

    requestLinkFor("md@example.com");

    expect(
      await screen.findByText(
        "If an account exists for that email, we've sent a link. It expires in 30 minutes.",
      ),
    ).toBeDefined();
    expect(forgotPassword).toHaveBeenCalledWith("md@example.com");
    expect(screen.queryByLabelText("Email")).toBeNull();
    expect(screen.getByRole("link", { name: "Back to log in" })).toBeDefined();
  });

  it("shows the server's message when it asks the user to slow down", async () => {
    vi.mocked(forgotPassword).mockRejectedValue(
      new ApiError(429, "Too many requests, please try again later."),
    );
    renderPage();

    requestLinkFor("md@example.com");

    const alert = await screen.findByText(
      "Too many requests, please try again later.",
    );
    expect(alert.closest('[role="alert"]')).not.toBeNull();
    expect(screen.getByLabelText("Email")).toBeDefined();
  });

  it("shows a general error when the request fails", async () => {
    vi.mocked(forgotPassword).mockRejectedValue(new Error("network down"));
    renderPage();

    requestLinkFor("md@example.com");

    expect(await screen.findByText("Something went wrong")).toBeDefined();
    expect(screen.queryByText(/we've sent a link/)).toBeNull();
  });
});
