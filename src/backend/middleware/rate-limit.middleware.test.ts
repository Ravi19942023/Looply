import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockLimit = vi.fn();
const mockGetRedisClient = vi.fn();
const mockErrorResponse = vi.fn((status: number, message: string, code?: string, details?: unknown) =>
  Response.json({ status, message, code, details }, { status }),
);

const { mockEnv } = vi.hoisted(() => ({
  mockEnv: {
    NODE_ENV: "test",
  },
}));

vi.mock("@/backend/config", () => ({
  env: mockEnv,
  appConfig: {
    dbProvider: "postgres",
    appRuntime: "node",
    jobMode: "inprocess",
    databaseUrl: "postgresql://user:pass@localhost:5432/app",
    databaseUrlDirect: "postgresql://user:pass@localhost:5432/app",
    appUrl: "http://localhost:3000",
    aiProvider: "openai",
    emailProvider: "ses",
    storageProvider: "s3",
    isDevelopment: true,
    isProduction: false,
    isServerless: false,
    usesExternalJobs: false,
  },
}));

vi.mock("@/backend/lib", async () => {
  const actual = await vi.importActual<typeof import("@/backend/lib")>("@/backend/lib");

  return {
    ...actual,
    getRedisClient: mockGetRedisClient,
    errorResponse: mockErrorResponse,
  };
});

vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: class FakeRatelimit {
    static slidingWindow(limit: number, window: string) {
      return { limit, window };
    }

    constructor() {}

    limit(identifier: string) {
      return mockLimit(identifier);
    }
  },
}));

describe("withRateLimit", () => {
  beforeEach(() => {
    mockGetRedisClient.mockReset();
    mockErrorResponse.mockClear();
    mockLimit.mockReset();
    mockEnv.NODE_ENV = "test";
  });

  it("allows the request when the limiter is unavailable in non-production", async () => {
    mockGetRedisClient.mockReturnValue(null);
    const { withRateLimit } = await import("./rate-limit.middleware");
    const request = new NextRequest("http://localhost/api/v1/customers");

    const response = await withRateLimit(request, async () => Response.json({ ok: true }));
    expect(response.status).toBe(200);
  }, 30000);

  it("adds rate limit headers on success", async () => {
    mockGetRedisClient.mockReturnValue({});
    mockLimit.mockResolvedValue({
      success: true,
      reset: 10,
      remaining: 59,
      limit: 60,
    });

    const { withRateLimit } = await import("./rate-limit.middleware");
    const request = new NextRequest("http://localhost/api/v1/customers", {
      headers: {
        "x-forwarded-for": "1.2.3.4",
      },
    });

    const response = await withRateLimit(request, async () => Response.json({ ok: true }));
    expect(response.status).toBe(200);
    expect(response.headers.get("X-RateLimit-Limit")).toBe("60");
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("59");
  }, 15000);

  it("returns 429 with headers on rejection", async () => {
    mockGetRedisClient.mockReturnValue({});
    mockLimit.mockResolvedValue({
      success: false,
      reset: 10,
      remaining: 0,
      limit: 60,
    });

    const { withRateLimit } = await import("./rate-limit.middleware");
    const request = new NextRequest("http://localhost/api/v1/customers");
    const response = await withRateLimit(request, async () => Response.json({ ok: true }));

    expect(response.status).toBe(429);
    expect(response.headers.get("X-RateLimit-Limit")).toBe("60");
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("0");
  });

  it("fails closed in production when redis is unavailable", async () => {
    mockEnv.NODE_ENV = "production";
    mockGetRedisClient.mockReturnValue(null);

    const { withRateLimit } = await import("./rate-limit.middleware");
    const request = new NextRequest("http://localhost/api/v1/customers");
    const response = await withRateLimit(request, async () => Response.json({ ok: true }));

    expect(response.status).toBe(503);
  });
});
