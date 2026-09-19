const API_URL = import.meta.env.VITE_API_URL;

interface ApiErrorResponse {
  error: { message: string };
}

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface ApiFetchOptions {
  method?: string;
  body?: unknown;
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const hasBody = options.body !== undefined;

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    credentials: "include",
    headers: hasBody ? { "Content-Type": "application/json" } : undefined,
    body: hasBody ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 204) {
    if (!response.ok) {
      throw new ApiError(response.status, "Something went wrong");
    }
    return undefined as T;
  }

  if (!response.ok) {
    const errorBody = (await response.json()) as ApiErrorResponse;
    throw new ApiError(response.status, errorBody.error.message);
  }

  return (await response.json()) as T;
}
