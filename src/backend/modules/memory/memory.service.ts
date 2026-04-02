import type { IMemoryRepository } from "./memory.repository.interface";
import { ContextWindowManager } from "./context-window";
import { CONTEXT_WINDOW } from "./context-window.constants";
import type { ContextWindowResult } from "./context-window.types";
import type { AppendMessageInput, ConversationRecord, MemoryRecord } from "./memory.types";

const contextWindowConfig = {
  maxTokens: CONTEXT_WINDOW.MAX_TOKENS,
  summaryBudgetTokens: CONTEXT_WINDOW.SUMMARY_BUDGET_TOKENS,
};

export class MemoryService {
  private readonly contextWindowManager = new ContextWindowManager();

  constructor(private readonly memoryRepository: IMemoryRepository) { }

  async getMemory(userId: string): Promise<MemoryRecord | null> {
    return this.memoryRepository.findByUserId(userId);
  }

  async getContextWindow(sessionId: string): Promise<ContextWindowResult> {
    const allMessages = await this.memoryRepository.findAllMessages(sessionId);
    return this.contextWindowManager.buildWindow(allMessages, contextWindowConfig);
  }

  async getConversationContext(sessionId: string): Promise<ConversationRecord[]> {
    const windowResult = await this.getContextWindow(sessionId);
    return windowResult.messages;
  }

  async appendMessage(sessionId: string, message: AppendMessageInput): Promise<void> {
    await this.memoryRepository.appendMessage({
      ...message,
      sessionId,
    });
  }

  async updateLongTermMemory(
    userId: string,
    field: string,
    value: unknown,
  ): Promise<void> {
    await this.memoryRepository.updateMemoryField(userId, field, value);
  }

  getContextWindowManager(): ContextWindowManager {
    return this.contextWindowManager;
  }
}
