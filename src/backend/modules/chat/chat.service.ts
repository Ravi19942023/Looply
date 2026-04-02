import type { MemoryService } from "@/backend/modules/memory";
import type { RagService } from "@/backend/modules/rag";

import { chatSystemPromptTemplate } from "@/backend/lib/prompts/chat-system.prompt";
import type { PromptContext, UserMemorySnapshot } from "./prompt-builder.types";
import type { ChatMessage } from "./chat.types";

export class ChatService {
  constructor(
    private readonly memoryService: MemoryService,
    private readonly ragService: RagService,
  ) { }

  async buildSystemContext(actorId: string, sessionId: string): Promise<string> {
    const memory = await this.memoryService.getMemory(actorId);
    const windowResult = await this.memoryService.getContextWindow(sessionId);
    const summary = windowResult.droppedCount > 0
      ? await this.memoryService.getContextWindowManager().compressSummary(
          windowResult.messages.slice(0, windowResult.droppedCount),
          null,
        )
      : null;

    let userMemory: UserMemorySnapshot | null = null;

    if (memory) {
      userMemory = {
        preferredTone: memory.preferredTone,
        businessType: memory.businessType,
        typicalCampaigns: memory.typicalCampaigns,
        customContext: memory.customContext,
      };
    }

    const context: PromptContext = {
      ragContext: null,
      userMemory,
      conversationSummary: summary,
      availableTools: [],
      currentDate: new Date().toISOString().slice(0, 10),
      sessionId,
    };

    return chatSystemPromptTemplate(context);
  }

  async getConversationHistory(sessionId: string): Promise<ChatMessage[]> {
    const windowResult = await this.memoryService.getContextWindow(sessionId);

    return windowResult.messages.flatMap((message) => {
      if (
        message.role === "system" ||
        message.role === "user" ||
        message.role === "assistant"
      ) {
        return [
          {
            id: message.id,
            role: message.role as "system" | "user" | "assistant",
            content: message.content,
            parts: message.parts as any,
            attachments: message.attachments,
            metadata: {
              createdAt: message.createdAt.toISOString(),
            },
          } as ChatMessage,
        ];
      }

      return [];
    });
  }

  async appendUserMessage(sessionId: string, content: string, parts?: any[], attachments?: any[]): Promise<void> {
    await this.memoryService.appendMessage(sessionId, {
      sessionId,
      role: "user",
      content,
      parts,
      attachments,
    });
  }

  async appendAssistantMessage(sessionId: string, content: string, parts?: any[]): Promise<void> {
    await this.memoryService.appendMessage(sessionId, {
      sessionId,
      role: "assistant",
      content,
      parts,
    });
  }
}
