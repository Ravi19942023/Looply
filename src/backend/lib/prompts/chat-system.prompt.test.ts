import { describe, expect, it } from "vitest";

import { chatSystemPromptTemplate } from "@/backend/lib/prompts/chat-system.prompt";

describe("buildSystemPrompt", () => {
  it("treats an empty auto-retrieval result as a retrieval miss", () => {
    const prompt = chatSystemPromptTemplate({
      ragContext: null,
      userMemory: null,
      conversationSummary: null,
      availableTools: [],
      currentDate: "2026-03-31",
      sessionId: "session-1",
    });

    expect(prompt).toContain("Treat this as a retrieval miss");
    expect(prompt).toContain("call `retrieveKnowledgeContext` before concluding nothing exists");
  });
});
