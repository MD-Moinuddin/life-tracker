import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "./api-client";
import { forgotPassword, resetPassword } from "./auth-api";

vi.mock("./api-client", () => ({ apiFetch: vi.fn() }));

beforeEach(() => {
  vi.resetAllMocks();
});

describe("auth API client", () => {
  it("asks for a reset link with a POST body", async () => {
    await forgotPassword("md@example.com");

    expect(apiFetch).toHaveBeenCalledWith("/api/auth/forgot-password", {
      method: "POST",
      body: { email: "md@example.com" },
    });
  });

  it("sends the token and new password to reset", async () => {
    await resetPassword({ token: "abc", password: "GoodPassword1" });

    expect(apiFetch).toHaveBeenCalledWith("/api/auth/reset-password", {
      method: "POST",
      body: { token: "abc", password: "GoodPassword1" },
    });
  });
});
