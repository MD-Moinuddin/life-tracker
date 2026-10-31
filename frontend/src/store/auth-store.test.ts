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

describe("auth store demo", () => {
  const DEMO_USER = { ...SESSION.user, isDemo: true };

  it("signs a demo visitor in without leaving a session hint", () => {
    useAuthStore.getState().startDemo(DEMO_USER);

    expect(useAuthStore.getState().user).toEqual(DEMO_USER);
    expect(useAuthStore.getState().accessToken).not.toBeNull();
    expect(hasSessionHint()).toBe(false);
  });

  it("leaves the demo without forgetting a real visitor's hint", () => {
    useAuthStore.getState().setAuth(SESSION);
    useAuthStore.getState().startDemo(DEMO_USER);

    useAuthStore.getState().exitDemo();

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(hasSessionHint()).toBe(true);
  });
});
