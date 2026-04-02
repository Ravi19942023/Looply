import type { ConversationRecord } from "./memory.types";

export interface ContextWindowConfig {
  maxTokens: number;
  summaryBudgetTokens: number;
}

export interface ContextWindowResult {
  messages: ConversationRecord[];
  compressedSummary: string | null;
  tokenCount: number;
  droppedCount: number;
}

export interface MessageGroup {
  messages: ConversationRecord[];
  tokenCount: number;
}
