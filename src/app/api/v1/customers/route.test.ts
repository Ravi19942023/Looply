import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { listMock, mockContainer, withErrorBoundary, withRequestLog, withRateLimit, withAuth, withGuard } =
  vi.hoisted(() => {
    const listMock = vi.fn();
    return {
      listMock,
      mockContainer: {
        resolve: vi.fn(() => ({ list: listMock })),
      },
      withErrorBoundary: vi.fn(async (handler: () => Promise<Response>) => handler()),
      withRequestLog: vi.fn(async (_req: NextRequest, handler: () => Promise<Response>) => handler()),
      withRateLimit: vi.fn(async (_req: NextRequest, handler: () => Promise<Response>) => handler()),
      withAuth: vi.fn(
        async (_req: NextRequest, handler: (actorId: string, role: string) => Promise<Response>) =>
          handler("actor-1", "viewer"),
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

import { GET } from "./route";

describe("customers route", () => {
  it("composes middleware and delegates to the controller", async () => {
    listMock.mockResolvedValue(Response.json({ ok: true }));

    const request = new NextRequest("http://localhost/api/v1/customers");
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(withErrorBoundary).toHaveBeenCalled();
    expect(withRequestLog).toHaveBeenCalled();
    expect(withRateLimit).toHaveBeenCalled();
    expect(withAuth).toHaveBeenCalled();
    expect(withGuard).toHaveBeenCalled();
    expect(listMock).toHaveBeenCalled();
  });
});
