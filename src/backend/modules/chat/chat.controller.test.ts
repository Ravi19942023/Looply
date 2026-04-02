import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { buildAllToolsMock, stepCountIsMock, streamTextMock } = vi.hoisted(() => ({
  buildAllToolsMock: vi.fn(),
  stepCountIsMock: vi.fn((steps: number) => ({ steps })),
  streamTextMock: vi.fn(),
}));

vi.mock("ai", () => ({
  stepCountIs: stepCountIsMock,
  streamText: streamTextMock,
}));

vi.mock("./tools", () => ({
  buildAllTools: buildAllToolsMock,
}));

import { ChatController } from "./chat.controller";

describe("ChatController", () => {
  beforeEach(() => {
    buildAllToolsMock.mockReset();
    stepCountIsMock.mockClear();
    streamTextMock.mockReset();
  });

  it("returns validation errors for invalid payloads", async () => {
    const controller = new ChatController(
      { buildSystemContext: vi.fn(), getConversationHistory: vi.fn(), appendUserMessage: vi.fn(), appendAssistantMessage: vi.fn() } as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      { log: vi.fn() } as never,
    );

    const request = new NextRequest("http://localhost/api/v1/chat", {
      method: "POST",
      body: JSON.stringify({ sessionId: "", messages: [] }),
    });

    const response = await controller.streamChat(request, "actor-1");

    expect(response.status).toBe(400);
  });

  it("streams with tools and persists the interaction", async () => {
    const appendUserMessage = vi.fn().mockResolvedValue(undefined);
    const appendAssistantMessage = vi.fn().mockResolvedValue(undefined);
    const auditLog = vi.fn().mockResolvedValue(undefined);
    const response = new Response("stream");

    buildAllToolsMock.mockReturnValue({ getTopCustomers: {} });
    streamTextMock.mockImplementation((options: Record<string, unknown>) => {
      void (options.onStepFinish as (step: unknown) => Promise<void>)?.({
        toolCalls: [{ toolName: "getTopCustomers" }],
      });
      void (options.onFinish as (event: unknown) => Promise<void>)?.({
        finishReason: "stop",
        steps: [{}, {}],
        text: "assistant reply",
        totalUsage: { promptTokens: 1, completionTokens: 2, totalTokens: 3 },
      });

      return {
        toUIMessageStreamResponse: () => response,
      };
    });

    const controller = new ChatController(
      {
        buildSystemContext: vi.fn().mockResolvedValue("system"),
        getConversationHistory: vi.fn().mockResolvedValue([{ role: "assistant", content: "Earlier" }]),
        appendUserMessage,
        appendAssistantMessage,
      } as never,
      {} as never,
      {} as never,
      {} as never,
      { retrieveContextForQuery: vi.fn().mockResolvedValue([]), formatContextForPrompt: vi.fn().mockReturnValue(null) } as never,
      { getMemory: vi.fn().mockResolvedValue(null), getContextWindow: vi.fn().mockResolvedValue({ messages: [], droppedCount: 0 }), getContextWindowManager: vi.fn().mockReturnValue({ compressSummary: vi.fn().mockResolvedValue(null) }) } as never,
      { findByChatAndActor: vi.fn().mockResolvedValue([]) } as never,
      { log: auditLog } as never,
    );

    const request = new NextRequest("http://localhost/api/v1/chat", {
      method: "POST",
      body: JSON.stringify({
        sessionId: "session-1",
        messages: [{ role: "user", content: "Hello" }],
      }),
    });

    const result = await controller.streamChat(request, "actor-1");

    expect(result).toBe(response);
    expect(appendUserMessage).toHaveBeenCalledWith("session-1", "Hello");
    expect(streamTextMock).toHaveBeenCalled();
    expect(stepCountIsMock).toHaveBeenCalled();
    expect(streamTextMock).toHaveBeenCalledWith(expect.objectContaining({
      model: "openai/gpt-4.1-mini",
    }));
    expect(buildAllToolsMock).toHaveBeenCalled();
    expect(auditLog).toHaveBeenCalled();
    expect(appendAssistantMessage).toHaveBeenCalledWith("session-1", "assistant reply");
  });

  it("injects retrieved rag context into the system prompt", async () => {
    buildAllToolsMock.mockReturnValue({});
    streamTextMock.mockImplementation(() => ({
      toUIMessageStreamResponse: () => new Response("stream"),
    }));

    const controller = new ChatController(
      {
        buildSystemContext: vi.fn().mockResolvedValue("system"),
        getConversationHistory: vi.fn().mockResolvedValue([]),
        appendUserMessage: vi.fn().mockResolvedValue(undefined),
        appendAssistantMessage: vi.fn().mockResolvedValue(undefined),
      } as never,
      {} as never,
      {} as never,
      {} as never,
      {
        retrieveContextForQuery: vi.fn().mockResolvedValue([
          { id: "doc-1:0", score: 0.45, text: "Carion Portal setup", fileName: "carion.pdf" },
        ]),
        formatContextForPrompt: vi.fn().mockReturnValue("### Source: carion.pdf\n> Carion Portal setup"),
      } as never,
      {
        getMemory: vi.fn().mockResolvedValue(null),
        getContextWindow: vi.fn().mockResolvedValue({ messages: [], droppedCount: 0 }),
        getContextWindowManager: vi.fn().mockReturnValue({ compressSummary: vi.fn().mockResolvedValue(null) }),
      } as never,
      { findByChatAndActor: vi.fn().mockResolvedValue([]) } as never,
      { log: vi.fn().mockResolvedValue(undefined) } as never,
    );

    const request = new NextRequest("http://localhost/api/v1/chat", {
      method: "POST",
      body: JSON.stringify({
        sessionId: "session-1",
        messages: [{ role: "user", content: "What is Carion Portal?" }],
      }),
    });

    await controller.streamChat(request, "actor-1");

    expect(streamTextMock).toHaveBeenCalledWith(expect.objectContaining({
      system: expect.stringContaining("Carion Portal setup"),
    }));
  });
});
