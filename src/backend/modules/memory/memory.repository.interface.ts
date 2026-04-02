import type { AppendMessageInput, ConversationRecord, MemoryRecord } from "./memory.types";

export interface IMemoryRepository {
  findByUserId(userId: string): Promise<MemoryRecord | null>;
  findRecentMessages(sessionId: string, limit: number): Promise<ConversationRecord[]>;
  findAllMessages(sessionId: string): Promise<ConversationRecord[]>;
  appendMessage(input: AppendMessageInput): Promise<void>;
  updateMemoryField(userId: string, field: string, value: unknown): Promise<void>;
}
