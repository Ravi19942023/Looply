import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { deleteMock, withErrorBoundary, withRequestLog, withRateLimit, withAuth } =
  vi.hoisted(() => ({
    deleteMock: vi.fn(),
    withErrorBoundary: vi.fn(async (handler: () => Promise<Response>) => handler()),
    withRequestLog: vi.fn(async (_req: NextRequest, handler: () => Promise<Response>) => handler()),
    withRateLimit: vi.fn(async (_req: NextRequest, handler: () => Promise<Response>) => handler()),
    withAuth: vi.fn(async (_req: NextRequest, handler: (actorId: string, role: string) => Promise<Response>) =>
      handler("actor-1", "viewer")),
  }));

vi.mock("@/backend/middleware", () => ({
  withErrorBoundary,
  withRequestLog,
  withRateLimit,
  withAuth,
}));
vi.mock("@/backend/lib/bootstrap", () => ({
  ensureBootstrap: vi.fn(async () => ({
    resolve: vi.fn(() => ({
      delete: deleteMock,
    })),
  })),
}));

import { DELETE } from "./route";

describe("uploads [id] route", () => {
  it("delegates delete to the controller for the authenticated actor", async () => {
    deleteMock.mockResolvedValue(Response.json({ ok: true }));

    const request = new NextRequest("http://localhost/api/v1/uploads/doc-1", {
      method: "DELETE",
    });
    const response = await DELETE(request, {
      params: Promise.resolve({ id: "doc-1" }),
    });

    expect(response.status).toBe(200);
    expect(deleteMock).toHaveBeenCalledWith("doc-1", "actor-1");
  });
});
