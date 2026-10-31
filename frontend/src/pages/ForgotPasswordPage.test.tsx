import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
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
      await screen.findByRole("heading", {
        level: 1,
        name: "Check your email",
      }),
    ).toBeDefined();
    const status = screen.getByRole("status");
    expect(status.textContent).toContain("md@example.com");
    expect(status.textContent).toContain("we've sent a link");
    expect(status.textContent).toContain("30 minutes and only once");
    expect(status.textContent).toContain("spam folder");
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

  it("makes the visitor wait before asking for another link, then sends it again", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.mocked(forgotPassword).mockResolvedValue({ message: "ok" });
    renderPage();
    requestLinkFor("md@example.com");
    const again = await screen.findByRole("button", {
      name: /Send again in 60s/,
    });
    expect((again as HTMLButtonElement).disabled).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    const ready = screen.getByRole("button", { name: "Send again" });
    expect((ready as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(ready);
    await waitFor(() => expect(forgotPassword).toHaveBeenCalledTimes(2));
    expect(
      await screen.findByRole("button", { name: /Send again in 60s/ }),
    ).toBeDefined();
    vi.useRealTimers();
  });

  it("shows the error and keeps the wait if sending again fails", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.mocked(forgotPassword).mockResolvedValueOnce({ message: "ok" });
    renderPage();
    requestLinkFor("md@example.com");
    await screen.findByRole("button", { name: /Send again in/ });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    vi.mocked(forgotPassword).mockRejectedValueOnce(
      new ApiError(429, "Too many requests, please try again later."),
    );

    fireEvent.click(screen.getByRole("button", { name: "Send again" }));

    expect(
      await screen.findByText("Too many requests, please try again later."),
    ).toBeDefined();
    expect(
      (screen.getByRole("button", { name: "Send again" }) as HTMLButtonElement)
        .disabled,
    ).toBe(false);
    vi.useRealTimers();
  });
});
