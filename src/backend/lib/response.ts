import type { ApiResponse, PaginationMeta } from "@/shared/types";

export function successResponse<T>(
  status: number,
  data: T,
  meta?: { pagination?: PaginationMeta },
): Response {
  const body: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      ...meta,
      timestamp: new Date().toISOString(),
    },
  };

  return Response.json(body, { status });
}

export function errorResponse(
  status: number,
  message: string,
  code?: string,
  details?: unknown,
): Response {
  const body: ApiResponse = {
    success: false,
    error: {
      message,
      code,
      details,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  return Response.json(body, { status });
}
