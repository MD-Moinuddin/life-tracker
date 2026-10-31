import { afterEach, describe, expect, it } from "vitest";
import { hasSessionHint } from "../session-hint";
import { useAuthStore } from "../../store/auth-store";
import { demoDb } from "./demo-db";
import { endDemoSession, startDemoSession } from "./demo-session";

afterEach(() => {
  useAuthStore.setState({ user: null, accessToken: null });
  localStorage.clear();
});

describe("startDemoSession", () => {
  it("signs in a made-up demo visitor", () => {
    startDemoSession("2026-10-30");

    const { user, accessToken } = useAuthStore.getState();
    expect(user).toMatchObject({
      name: "Demo visitor",
      isDemo: true,
      email: "",
    });
    expect(accessToken).not.toBeNull();
  });

  it("loads fresh demo data around the given day, every time", () => {
    startDemoSession("2026-10-30");
    demoDb.shifts.length = 0;

    startDemoSession("2026-10-30");

    expect(demoDb.shifts.length).toBeGreaterThan(0);
    expect(demoDb.jobs).toHaveLength(2);
  });

  it("leaves no session hint, so a reload does not try to restore it", () => {
    startDemoSession("2026-10-30");

    expect(hasSessionHint()).toBe(false);
  });
});

describe("endDemoSession", () => {
  it("signs the demo visitor out without touching a real visitor's hint", () => {
    localStorage.setItem("lt-session-hint", "1");
    startDemoSession("2026-10-30");

    endDemoSession();

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(hasSessionHint()).toBe(true);
  });
});
