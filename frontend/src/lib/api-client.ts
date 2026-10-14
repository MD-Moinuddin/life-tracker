// Unset in production: requests go through the same-origin Vercel rewrite
// proxy instead of an absolute cross-domain URL (see frontend/vercel.json).
const API_URL = import.meta.env.VITE_API_URL ?? "";

export type FieldErrors = Record<string, string[]>;

interface ApiErrorResponse {
  error: { message: string; fields?: FieldErrors };
}

export class ApiError extends Error {
  readonly status: number;
  readonly fields: FieldErrors;

  constructor(status: number, message: string, fields: FieldErrors = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fields = fields;
  }
}

export interface ApiFetchOptions {
  method?: string;
  body?: unknown;
  accessToken?: string | null;
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const hasBody = options.body !== undefined;

  const headers: Record<string, string> = {};
  if (hasBody) {
    headers["Content-Type"] = "application/json";
  }
  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    credentials: "include",
    headers,
    body: hasBody ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 204) {
    if (!response.ok) {
      throw new ApiError(response.status, "Something went wrong");
    }
    return undefined as T;
  }

  if (!response.ok) {
    let message = "Something went wrong";
    let fields: FieldErrors = {};
    try {
      const { error } = (await response.json()) as ApiErrorResponse;
      message = error.message;
      fields = error.fields ?? {};
    } catch {
      // Response body wasn't valid JSON (e.g. a proxy/gateway error page) — fall back to the generic message.
    }
    throw new ApiError(response.status, message, fields);
  }

  return (await response.json()) as T;
}
