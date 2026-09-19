import { apiFetch } from "./api-client";
import type { AuthUser } from "../store/auth-store";

interface Credentials {
  email: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export function signup(credentials: Credentials) {
  return apiFetch<AuthUser>("/api/auth/signup", {
    method: "POST",
    body: credentials,
  });
}

export function login(credentials: Credentials) {
  return apiFetch<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: credentials,
  });
}

export function refresh() {
  return apiFetch<LoginResponse>("/api/auth/refresh", { method: "POST" });
}
