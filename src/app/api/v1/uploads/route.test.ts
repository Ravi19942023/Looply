import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { listMock, uploadMock, mockContainer, withErrorBoundary, withRequestLog, withRateLimit, withAuth } =
  vi.hoisted(() => {
    const listMock = vi.fn();
    const uploadMock = vi.fn();
    return {
      listMock,
      uploadMock,
      mockContainer: {
        resolve: vi.fn(() => ({ list: listMock, upload: uploadMock })),
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

vi.mock("@/backend/lib", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/backend/lib")>();
  return {
    ...actual,
    container: mockContainer,
  };
});

import { GET, POST } from "./route";

describe("uploads route", () => {
  it("delegates GET to the upload controller", async () => {
    listMock.mockResolvedValue(Response.json({ ok: true }));

    const response = await GET(new NextRequest("http://localhost/api/v1/uploads"));

    expect(response.status).toBe(200);
    expect(listMock).toHaveBeenCalledWith("actor-1");
  });

  it("delegates POST to the upload controller", async () => {
    uploadMock.mockResolvedValue(Response.json({ ok: true }));

    const request = new NextRequest("http://localhost/api/v1/uploads", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(uploadMock).toHaveBeenCalled();
  });
});
