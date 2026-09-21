import { apiFetch } from "./api-client";
import type { AuthUser } from "../store/auth-store";

interface LoginCredentials {
  email: string;
  password: string;
}

interface SignupCredentials extends LoginCredentials {
  name: string;
}

interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export function signup(credentials: SignupCredentials) {
  return apiFetch<AuthUser>("/api/auth/signup", {
    method: "POST",
    body: credentials,
  });
}

export function login(credentials: LoginCredentials) {
  return apiFetch<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: credentials,
  });
}

export function refresh() {
  return apiFetch<LoginResponse>("/api/auth/refresh", { method: "POST" });
}

export function logout() {
  return apiFetch<void>("/api/auth/logout", { method: "POST" });
}
