import { afterEach, describe, expect, it } from "vitest";
import { hasSessionHint } from "../lib/session-hint";
import { useAuthStore } from "./auth-store";

const SESSION = {
  user: { id: "u1", name: "Ada", email: "ada@example.com", createdAt: "x" },
  accessToken: "token",
};

afterEach(() => {
  useAuthStore.setState({ user: null, accessToken: null });
});

describe("auth store session hint", () => {
  it("remembers a signed-in visitor", () => {
    useAuthStore.getState().setAuth(SESSION);

    expect(hasSessionHint()).toBe(true);
  });

  it("forgets the visitor on clearAuth", () => {
    useAuthStore.getState().setAuth(SESSION);
    useAuthStore.getState().clearAuth();

    expect(hasSessionHint()).toBe(false);
  });
});
