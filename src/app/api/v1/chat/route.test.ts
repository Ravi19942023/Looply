import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { streamUiChat, withErrorBoundary, withRequestLog, withRateLimit, withAuth } = vi.hoisted(() => ({
  streamUiChat: vi.fn(),
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

vi.mock("@/backend/modules/chat/chat-ui.service", () => ({
  streamUiChat,
}));

import { DELETE, POST } from "./route";

describe("chat route", () => {
  beforeEach(() => {
    streamUiChat.mockReset();
  });

  it("streams valid chat payloads through the new UI service", async () => {
    streamUiChat.mockResolvedValue(Response.json({ ok: true }));

    const request = new NextRequest("http://localhost/api/v1/chat", {
      method: "POST",
      body: JSON.stringify({
        id: "11111111-1111-4111-8111-111111111111",
        messages: [
          {
            id: "22222222-2222-4222-8222-222222222222",
            role: "user",
            parts: [{ type: "text", text: "Hello" }],
          },
        ],
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(withErrorBoundary).toHaveBeenCalled();
    expect(withRequestLog).toHaveBeenCalled();
    expect(withRateLimit).toHaveBeenCalled();
    expect(withAuth).toHaveBeenCalled();
    expect(streamUiChat).toHaveBeenCalledWith({
      actorId: "actor-1",
      chatId: "11111111-1111-4111-8111-111111111111",
      messages: [
        {
          id: "22222222-2222-4222-8222-222222222222",
          role: "user",
          parts: [{ type: "text", text: "Hello" }],
        },
      ],
    });
  });

  it("rejects invalid payloads before invoking the stream service", async () => {
    const request = new NextRequest("http://localhost/api/v1/chat", {
      method: "POST",
      body: JSON.stringify({ id: "not-a-uuid", messages: [] }),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.code).toBe("bad_request:chat");
    expect(streamUiChat).not.toHaveBeenCalled();
  });

  it("requires a chat id for deletes", async () => {
    const request = new NextRequest("http://localhost/api/v1/chat", {
      method: "DELETE",
    });

    const response = await DELETE(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.code).toBe("bad_request:api");
  });
});
