import { useAuthStore } from "../../store/auth-store";
import type { AuthUser } from "../../store/auth-store";
import { buildDemoData } from "./demo-data";
import { loadDemoDb } from "./demo-db";

export const DEMO_USER_NAME = "Demo visitor";

const DEMO_USER: AuthUser = {
  id: "demo-user",
  name: DEMO_USER_NAME,
  email: "",
  createdAt: "2026-01-01T00:00:00.000Z",
  isDemo: true,
};

// Starts the demo: fresh made-up data around `today` (YYYY-MM-DD), and a
// signed-in demo visitor. Nothing is stored or sent anywhere.
export function startDemoSession(today: string) {
  loadDemoDb(buildDemoData(today));
  useAuthStore.getState().startDemo(DEMO_USER);
}

export function endDemoSession() {
  useAuthStore.getState().exitDemo();
}
