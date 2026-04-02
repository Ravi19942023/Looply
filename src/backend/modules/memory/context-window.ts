import type { ConversationRecord } from "./memory.types";
import type { ContextWindowConfig, ContextWindowResult, MessageGroup } from "./context-window.types";
import { CONTEXT_WINDOW } from "./context-window.constants";

const DEFAULT_CONFIG: ContextWindowConfig = {
  maxTokens: CONTEXT_WINDOW.MAX_TOKENS,
  summaryBudgetTokens: CONTEXT_WINDOW.SUMMARY_BUDGET_TOKENS,
};

export class ContextWindowManager {
  buildWindow(
    messages: ConversationRecord[],
    config: ContextWindowConfig = DEFAULT_CONFIG,
  ): ContextWindowResult {
    if (messages.length === 0) {
      return {
        messages: [],
        compressedSummary: null,
        tokenCount: 0,
        droppedCount: 0,
      };
    }

    const groups = this.groupMessagePairs(messages);
    const selectedGroups: MessageGroup[] = [];
    let budgetRemaining = config.maxTokens;
    let totalTokenCount = 0;
    let totalIncluded = 0;

    // Always include the latest group first
    const latestGroup = groups[groups.length - 1];
    if (latestGroup) {
      selectedGroups.push(latestGroup);
      budgetRemaining -= latestGroup.tokenCount;
      totalTokenCount += latestGroup.tokenCount;
      totalIncluded += latestGroup.messages.length;
    }

    // Walk backwards from second-to-last group
    for (let i = groups.length - 2; i >= 0; i--) {
      const group = groups[i];

      if (!group) {
        break;
      }

      if (group.tokenCount <= budgetRemaining) {
        selectedGroups.unshift(group);
        budgetRemaining -= group.tokenCount;
        totalTokenCount += group.tokenCount;
        totalIncluded += group.messages.length;
      } else {
        break;
      }
    }

    const includedMessages = selectedGroups.flatMap((group) => group.messages);
    const droppedCount = messages.length - totalIncluded;

    return {
      messages: includedMessages,
      compressedSummary: null,
      tokenCount: totalTokenCount,
      droppedCount,
    };
  }

  /**
   * Rough but fast token estimation.
   * OpenAI models average ~3.5 chars per token for English.
   * We use 3.5 instead of 4 to be conservative (safer to overcount).
   */
  estimateTokens(text: string): number {
    return Math.ceil(text.length / CONTEXT_WINDOW.CHARS_PER_TOKEN);
  }

  groupMessagePairs(messages: ConversationRecord[]): MessageGroup[] {
    const groups: MessageGroup[] = [];
    let currentGroup: ConversationRecord[] = [];

    for (const message of messages) {
      if (message.role === "tool") {
        // Attach tool result to the current group (must pair with preceding tool-call)
        currentGroup.push(message);
      } else if (message.role === "assistant" && currentGroup.length > 0) {
        // Flush previous group and start new one
        const tokenCount = currentGroup.reduce(
          (sum, msg) => sum + this.estimateTokens(msg.content),
          0,
        );
        groups.push({ messages: currentGroup, tokenCount });
        currentGroup = [message];
      } else {
        if (currentGroup.length > 0) {
          const tokenCount = currentGroup.reduce(
            (sum, msg) => sum + this.estimateTokens(msg.content),
            0,
          );
          groups.push({ messages: currentGroup, tokenCount });
        }
        currentGroup = [message];
      }
    }

    if (currentGroup.length > 0) {
      const tokenCount = currentGroup.reduce(
        (sum, msg) => sum + this.estimateTokens(msg.content),
        0,
      );
      groups.push({ messages: currentGroup, tokenCount });
    }

    return groups;
  }

  /**
   * Compress dropped messages into a short summary.
   * Falls back to a simple heuristic if no API key is available.
   */
  async compressSummary(
    droppedMessages: ConversationRecord[],
    existingSummary: string | null,
  ): Promise<string> {
    if (droppedMessages.length === 0) {
      return existingSummary ?? "";
    }

    const topics = droppedMessages
      .filter((msg) => msg.role === "user")
      .map((msg) => {
        const preview = msg.content.slice(0, 80);
        return preview.length < msg.content.length ? `${preview}...` : preview;
      })
      .join("; ");

    const summaryParts: string[] = [];

    if (existingSummary) {
      summaryParts.push(existingSummary);
    }

    if (topics) {
      summaryParts.push(`Earlier discussion: ${topics}`);
    }

    return summaryParts.join(" | ");
  }
}
