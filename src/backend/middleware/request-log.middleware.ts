import type { NextRequest } from "next/server";

import { logger } from "@/backend/lib";

type RequestHandler = () => Promise<Response>;

export async function withRequestLog(
  req: NextRequest,
  handler: RequestHandler,
): Promise<Response> {
  const start = performance.now();
  const response = await handler();
  const durationMs = Math.round(performance.now() - start);

  logger.info({
    method: req.method,
    path: req.nextUrl.pathname,
    status: response.status,
    durationMs,
    ip:
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown",
  });

  return response;
}
