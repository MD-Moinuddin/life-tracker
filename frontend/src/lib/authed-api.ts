import { ApiError, apiFetch } from "./api-client";
import type { ApiFetchOptions } from "./api-client";
import { refresh } from "./auth-api";
import { useAuthStore } from "../store/auth-store";

let pendingRefresh: Promise<string> | null = null;

// Simultaneous 401s share one refresh request instead of each sending their own.
function refreshAccessToken(): Promise<string> {
  pendingRefresh ??= refresh()
    .then((session) => {
      useAuthStore.getState().setAuth(session);
      return session.accessToken;
    })
    .finally(() => {
      pendingRefresh = null;
    });
  return pendingRefresh;
}

export async function authedFetch<T>(
  path: string,
  options: Omit<ApiFetchOptions, "accessToken"> = {},
): Promise<T> {
  const send = (accessToken: string | null) =>
    apiFetch<T>(path, { ...options, accessToken });

  try {
    return await send(useAuthStore.getState().accessToken);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) {
      throw error;
    }

    let accessToken: string;
    try {
      accessToken = await refreshAccessToken();
    } catch {
      useAuthStore.getState().clearAuth();
      throw error;
    }
    return send(accessToken);
  }
}
