import type { NextRequest } from "next/server";

import { Ratelimit } from "@upstash/ratelimit";

import { env } from "@/backend/config";
import { errorResponse, getRedisClient } from "@/backend/lib";

type RateLimitHandler = () => Promise<Response>;

function getRateLimiter(): Ratelimit | null {
  const redis = getRedisClient();

  if (!redis) {
    return null;
  }

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, "1 m"),
    analytics: true,
    prefix: "looply:ratelimit",
  });
}

export async function withRateLimit(
  req: NextRequest,
  handler: RateLimitHandler,
): Promise<Response> {
  const ratelimit = getRateLimiter();

  if (!ratelimit) {
    if (env.NODE_ENV === "production") {
      return errorResponse(
        503,
        "Rate limiting is required in production.",
        "RATE_LIMIT_UNAVAILABLE",
      );
    }

    return handler();
  }

  const identifier =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "anonymous";

  let success: boolean;
  let reset: number;
  let remaining: number;
  let limit: number;

  try {
    ({ success, reset, remaining, limit } = await ratelimit.limit(identifier));
  } catch (error) {
    if (env.NODE_ENV !== "production") {
      return handler();
    }

    return errorResponse(
      503,
      "Rate limiting is required in production.",
      "RATE_LIMIT_UNAVAILABLE",
      error instanceof Error ? { message: error.message } : undefined,
    );
  }

  const headers = {
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(reset),
  };

  if (!success) {
    const response = errorResponse(429, "Rate limit exceeded", "RATE_LIMITED", {
      limit,
      remaining,
      reset,
    });
    Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
    return response;
  }

  const response = await handler();
  Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
  return response;
}
