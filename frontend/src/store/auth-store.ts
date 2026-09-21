import { create } from "zustand";

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
  setAuth: ({ user, accessToken }) => set({ user, accessToken }),
  clearAuth: () => set({ user: null, accessToken: null }),
  setInitialized: () => set({ isInitialized: true }),
}));
