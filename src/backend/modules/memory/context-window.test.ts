import { describe, expect, it } from "vitest";

import { ContextWindowManager } from "./context-window";
import type { ContextWindowConfig } from "./context-window.types";

function makeMessage(
  role: string,
  content: string,
  overrides: Partial<{ id: string; sessionId: string; createdAt: Date }> = {},
) {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    sessionId: overrides.sessionId ?? "session-1",
    role,
    content,
    parts: [],
    attachments: [],
    createdAt: overrides.createdAt ?? new Date(),
  };
}

const DEFAULT_CONFIG: ContextWindowConfig = {
  maxTokens: 6_144,
  summaryBudgetTokens: 400,
};

describe("ContextWindowManager", () => {
  const manager = new ContextWindowManager();

  describe("estimateTokens", () => {
    it("estimates tokens using 3.5 chars per token ratio", () => {
      expect(manager.estimateTokens("a".repeat(35))).toBe(10);
      expect(manager.estimateTokens("a".repeat(70))).toBe(20);
    });

    it("rounds up", () => {
      expect(manager.estimateTokens("a".repeat(1))).toBe(1);
      expect(manager.estimateTokens("a".repeat(4))).toBe(2);
    });
  });

  describe("groupMessagePairs", () => {
    it("groups consecutive messages", () => {
      const messages = [
        makeMessage("user", "hello"),
        makeMessage("assistant", "hi"),
      ];
      const groups = manager.groupMessagePairs(messages);
      expect(groups).toHaveLength(2);
    });

    it("attaches tool messages to the preceding group", () => {
      const messages = [
        makeMessage("user", "hello"),
        makeMessage("assistant", "calling tool"),
        makeMessage("tool", "tool result"),
      ];
      const groups = manager.groupMessagePairs(messages);
      expect(groups).toHaveLength(2);
      expect(groups[1]?.messages).toHaveLength(2);
    });
  });

  describe("buildWindow", () => {
    it("returns empty result for empty messages", () => {
      const result = manager.buildWindow([], DEFAULT_CONFIG);
      expect(result.messages).toHaveLength(0);
      expect(result.tokenCount).toBe(0);
      expect(result.droppedCount).toBe(0);
    });

    it("always includes the latest message", () => {
      const messages = [
        makeMessage("user", "first message that is quite long and has many tokens"),
        makeMessage("assistant", "second message"),
        makeMessage("user", "latest message"),
      ];
      const result = manager.buildWindow(messages, {
        maxTokens: 1000,
        summaryBudgetTokens: 100,
      });

      expect(result.messages.length).toBeGreaterThan(0);
      const lastMessage = result.messages[result.messages.length - 1];
      expect(lastMessage?.content).toBe("latest message");
    });

    it("respects token budget", () => {
      const longContent = "x".repeat(1000);
      const messages = Array.from({ length: 20 }, (_, i) =>
        makeMessage(i % 2 === 0 ? "user" : "assistant", longContent),
      );

      const result = manager.buildWindow(messages, {
        maxTokens: 500,
        summaryBudgetTokens: 100,
      });

      expect(result.tokenCount).toBeLessThanOrEqual(500);
      expect(result.droppedCount).toBeGreaterThan(0);
    });

    it("keeps all messages when budget is sufficient", () => {
      const messages = [
        makeMessage("user", "short"),
        makeMessage("assistant", "ok"),
      ];

      const result = manager.buildWindow(messages, {
        maxTokens: 10000,
        summaryBudgetTokens: 100,
      });

      expect(result.messages).toHaveLength(2);
      expect(result.droppedCount).toBe(0);
    });
  });

  describe("compressSummary", () => {
    it("returns existing summary when no dropped messages", async () => {
      const result = await manager.compressSummary([], "existing summary");
      expect(result).toBe("existing summary");
    });

    it("returns empty string when nothing to summarize", async () => {
      const result = await manager.compressSummary([], null);
      expect(result).toBe("");
    });

    it("includes user message previews in summary", async () => {
      const dropped = [
        makeMessage("user", "What are the top customers?"),
        makeMessage("assistant", "Here are the top customers..."),
      ];

      const result = await manager.compressSummary(dropped, null);
      expect(result).toContain("What are the top customers?");
    });

    it("appends to existing summary", async () => {
      const dropped = [makeMessage("user", "New topic")];
      const result = await manager.compressSummary(dropped, "Old summary");
      expect(result).toContain("Old summary");
      expect(result).toContain("New topic");
    });
  });
});
