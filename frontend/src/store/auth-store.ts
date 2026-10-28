import { create } from "zustand";
import { clearSessionHint, saveSessionHint } from "../lib/session-hint";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isInitialized: boolean;
  setAuth: (auth: { user: AuthUser; accessToken: string }) => void;
  clearAuth: () => void;
  setInitialized: () => void;
}

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
  setInitialized: () => set({ isInitialized: true }),
}));
