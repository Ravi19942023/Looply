import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { createMock, mockContainer, withErrorBoundary, withRequestLog, withRateLimit, withAuth, withGuard } =
  vi.hoisted(() => {
    const createMock = vi.fn();
    return {
      createMock,
      mockContainer: {
        resolve: vi.fn(() => ({ create: createMock })),
      },
      withErrorBoundary: vi.fn(async (handler: () => Promise<Response>) => handler()),
      withRequestLog: vi.fn(async (_req: NextRequest, handler: () => Promise<Response>) => handler()),
      withRateLimit: vi.fn(async (_req: NextRequest, handler: () => Promise<Response>) => handler()),
      withAuth: vi.fn(
        async (_req: NextRequest, handler: (actorId: string, role: string) => Promise<Response>) =>
          handler("actor-1", "manager"),
      ),
      withGuard: vi.fn(async (_role: string, _minimum: string, handler: () => Promise<Response>) =>
        handler(),
      ),
    };
  });

vi.mock("@/backend/middleware", () => ({
  withErrorBoundary,
  withRequestLog,
  withRateLimit,
  withAuth,
}));

vi.mock("@/backend/guards", () => ({
  withGuard,
}));

vi.mock("@/backend/lib/bootstrap", () => ({
  ensureBootstrap: vi.fn(async () => mockContainer),
}));

vi.mock("@/backend/lib", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/backend/lib")>();
  return {
    ...actual,
    container: mockContainer,
  };
});

import { POST } from "./route";

describe("campaigns route", () => {
  it("composes middleware and delegates to create", async () => {
    createMock.mockResolvedValue(Response.json({ ok: true }));

    const request = new NextRequest("http://localhost/api/v1/campaigns", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(withErrorBoundary).toHaveBeenCalled();
    expect(withRequestLog).toHaveBeenCalled();
    expect(withRateLimit).toHaveBeenCalled();
    expect(withAuth).toHaveBeenCalled();
    expect(withGuard).toHaveBeenCalled();
    expect(createMock).toHaveBeenCalled();
  });
});
