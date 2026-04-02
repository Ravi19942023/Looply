import type { ApiResponse } from "@/shared/types";

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly payload?: ApiResponse,
  ) {
    super(payload?.error?.message ?? `Request failed with status ${status}`);
    this.name = "ApiClientError";
  }
}

export async function apiClient<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {
    ...options,
    credentials: "include",
    headers,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.success) {
    throw new ApiClientError(response.status, payload);
  }

  return payload.data as T;
}
