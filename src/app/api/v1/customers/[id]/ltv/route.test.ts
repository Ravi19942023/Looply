import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { ltvMock, mockContainer, withErrorBoundary, withRequestLog, withRateLimit, withAuth, withGuard } =
  vi.hoisted(() => {
    const ltvMock = vi.fn();
    return {
      ltvMock,
      mockContainer: {
        resolve: vi.fn(() => ({ ltv: ltvMock })),
      },
      withErrorBoundary: vi.fn(async (handler: () => Promise<Response>) => handler()),
      withRequestLog: vi.fn(async (_req: NextRequest, handler: () => Promise<Response>) => handler()),
      withRateLimit: vi.fn(async (_req: NextRequest, handler: () => Promise<Response>) => handler()),
      withAuth: vi.fn(async (_req: NextRequest, handler: (actorId: string, role: string) => Promise<Response>) =>
        handler("actor-1", "analyst")),
      withGuard: vi.fn(async (_role: string, _minimum: string, handler: () => Promise<Response>) =>
        handler()),
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

import { GET } from "./route";

describe("customers [id] ltv route", () => {
  it("enforces analyst access and delegates to the controller", async () => {
    ltvMock.mockResolvedValue(Response.json({ ok: true }));

    const request = new NextRequest("http://localhost/api/v1/customers/customer-1/ltv");
    const response = await GET(request, {
      params: Promise.resolve({ id: "customer-1" }),
    });

    expect(response.status).toBe(200);
    expect(withGuard).toHaveBeenCalled();
    expect(ltvMock).toHaveBeenCalledWith("customer-1", "actor-1");
  });
});
