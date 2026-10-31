import { create } from "zustand";
import { clearSessionHint, saveSessionHint } from "../lib/session-hint";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  // True for the made-up visitor of the demo, whose data lives only in memory.
  isDemo?: boolean;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isInitialized: boolean;
  setAuth: (auth: { user: AuthUser; accessToken: string }) => void;
  clearAuth: () => void;
  // Demo mode signs in a made-up user without touching the session hint, which
  // belongs to real sign-ins.
  startDemo: (user: AuthUser) => void;
  exitDemo: () => void;
  setInitialized: () => void;
}

// Never sent anywhere: demo requests are answered in the browser.
const DEMO_ACCESS_TOKEN = "demo";

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isInitialized: false,
  setAuth: ({ user, accessToken }) => {
    saveSessionHint();
    set({ user, accessToken });
  },
  clearAuth: () => {
    clearSessionHint();
    set({ user: null, accessToken: null });
  },
  startDemo: (user) => set({ user, accessToken: DEMO_ACCESS_TOKEN }),
  exitDemo: () => set({ user: null, accessToken: null }),
  setInitialized: () => set({ isInitialized: true }),
}));
