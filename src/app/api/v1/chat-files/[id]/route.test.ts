import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { deleteMock, mockContainer, withErrorBoundary, withRequestLog, withRateLimit, withAuth } = vi.hoisted(() => {
  const deleteMock = vi.fn();
  return {
    deleteMock,
    mockContainer: {
      resolve: vi.fn(() => ({ delete: deleteMock })),
    },
    withErrorBoundary: vi.fn(async (handler: () => Promise<Response>) => handler()),
    withRequestLog: vi.fn(async (_req: NextRequest, handler: () => Promise<Response>) => handler()),
    withRateLimit: vi.fn(async (_req: NextRequest, handler: () => Promise<Response>) => handler()),
    withAuth: vi.fn(async (_req: NextRequest, handler: (actorId: string, role: string) => Promise<Response>) =>
      handler("actor-1", "viewer")),
  };
});

vi.mock("@/backend/middleware", () => ({
  withErrorBoundary,
  withRequestLog,
  withRateLimit,
  withAuth,
}));

vi.mock("@/backend/lib/bootstrap", () => ({
  ensureBootstrap: vi.fn(async () => mockContainer),
}));

import { DELETE } from "./route";

describe("chat-files [id] route", () => {
  it("delegates DELETE to the chat file controller", async () => {
    deleteMock.mockResolvedValue(Response.json({ ok: true }));

    const response = await DELETE(
      new NextRequest("http://localhost/api/v1/chat-files/doc-1", { method: "DELETE" }),
      {
        params: Promise.resolve({ id: "doc-1" }),
      },
    );

    expect(response.status).toBe(200);
    expect(deleteMock).toHaveBeenCalledWith("doc-1", "actor-1");
  });
});
