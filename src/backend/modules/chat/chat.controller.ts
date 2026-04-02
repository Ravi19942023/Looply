import {
  convertToModelMessages,
  stepCountIs,
  streamText
} from "ai";
import type { NextRequest } from "next/server";

import { errorResponse } from "@/backend/lib";
import { getTextFromMessage } from "@/lib/utils";
import type { IAuditService } from "@/backend/modules/audit";
import { AUDIT_EVENTS } from "@/backend/modules/audit";
import type { AnalyticsService } from "@/backend/modules/analytics";
import type { CampaignService } from "@/backend/modules/campaigns";
import type { CustomerService } from "@/backend/modules/customers";
import type { MemoryService } from "@/backend/modules/memory";
import { RagService } from "@/backend/modules/rag";

import { chatSystemPromptTemplate } from "@/backend/lib/prompts/chat-system.prompt";
import type { PromptContext, UserMemorySnapshot } from "./prompt-builder.types";
import { CHAT_MAX_STEPS, CHAT_MODEL } from "./chat.constants";
import { getLanguageModel } from "@/lib/ai/providers";
import { ChatRequestSchema } from "./chat.schema";
import type { ChatService } from "./chat.service";
import type { ChatMessage } from "./chat.types";
import { buildAllTools } from "./tools";
import type { IChatDocumentRepository } from "../chat-files";

export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly customerService: CustomerService,
    private readonly campaignService: CampaignService,
    private readonly analyticsService: AnalyticsService,
    private readonly ragService: RagService,
    private readonly memoryService: MemoryService,
    private readonly chatDocumentRepository: IChatDocumentRepository,
    private readonly auditService: IAuditService,
  ) { }

  async streamChat(req: NextRequest, actorId: string): Promise<Response> {
    const body = await req.json().catch(() => null);
    const parsed = ChatRequestSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(400, "Validation failed", "VALIDATION_ERROR", parsed.error.flatten());
    }

    const { messages, sessionId } = parsed.data;
    const latestUserMessage = [...messages].reverse().find((m) => m.role === "user");

    // Track the initial user intent
    if (latestUserMessage) {
      await this.chatService.appendUserMessage(sessionId, getTextFromMessage(latestUserMessage as any));
    }

    // Build the AI's operating environment
    const context = await this.buildPromptContext(actorId, sessionId, latestUserMessage);
    const systemPrompt = chatSystemPromptTemplate(context);
    const tools = this.getTools(actorId, sessionId);

    // Initialize the streaming dialogue
    const result = streamText({
      model: getLanguageModel(CHAT_MODEL),
      system: systemPrompt,
      messages: await convertToModelMessages(messages as any),
      tools,
      stopWhen: stepCountIs(CHAT_MAX_STEPS),
      providerOptions: {
        openai: { user: actorId, store: false },
      },
      onStepFinish: (step) => this.logToolUsage(actorId, sessionId, step),
      onFinish: (event) => this.finalizeChatTurn(actorId, sessionId, event),
    });

    return result.toUIMessageStreamResponse({
      messageMetadata: () => ({ model: CHAT_MODEL, timestamp: Date.now() }),
      onError: (error) => (error instanceof Error ? error.message : "An error occurred."),
    });
  }

  private async buildPromptContext(
    actorId: string,
    sessionId: string,
    latestUserMessage?: any,
  ): Promise<PromptContext> {
    const [ragContext, memory, windowResult, sessionDocs] = await Promise.all([
      this.getRagContext(actorId, sessionId, latestUserMessage),
      this.memoryService.getMemory(actorId),
      this.memoryService.getContextWindow(sessionId),
      this.chatDocumentRepository.findByChatAndActor(sessionId, actorId),
    ]);

    const summary =
      windowResult.droppedCount > 0
        ? await this.memoryService
          .getContextWindowManager()
          .compressSummary(windowResult.messages.slice(0, windowResult.droppedCount), null)
        : null;

    return {
      ragContext,
      userMemory: this.mapUserMemory(memory),
      conversationSummary: summary,
      availableTools: [],
      currentDate: new Date().toISOString().slice(0, 10),
      sessionId,
      sessionFiles: sessionDocs.map((doc) => ({ fileName: doc.fileName, id: doc.id })),
    };
  }

  private async getRagContext(
    actorId: string,
    sessionId: string,
    message?: ChatMessage,
  ): Promise<string | null> {
    if (!message) return null;
    try {
      const chunks = await this.ragService.retrieveContextForQuery(actorId, getTextFromMessage(message), {
        chatId: sessionId,
      });
      return this.ragService.formatContextForPrompt(chunks);
    } catch {
      return null;
    }
  }

  private mapUserMemory(memory: any): UserMemorySnapshot | null {
    if (!memory) return null;
    return {
      preferredTone: memory.preferredTone,
      businessType: memory.businessType,
      typicalCampaigns: memory.typicalCampaigns,
      customContext: memory.customContext,
    };
  }

  private getTools(actorId: string, sessionId: string) {
    return buildAllTools(
      {
        customerService: this.customerService,
        campaignService: this.campaignService,
        analyticsService: this.analyticsService,
        ragService: this.ragService,
        memoryService: this.memoryService,
      },
      actorId,
      sessionId,
    );
  }


  private async logToolUsage(
    actorId: string,
    sessionId: string,
    step: any
  ) {
    if (!step.toolCalls.length) return;

    const toolDetails = step.toolCalls.map((call: any) => {
      const result = step.toolResults?.find((r: any) => r.toolCallId === call.toolCallId);
      return {
        name: call.toolName,
        input: (call as any).input ?? {},
        output: (result as any)?.output ?? {},
      };
    });

    await this.auditService.log({
      actorId,
      event: AUDIT_EVENTS.AI_TOOL_CALL,
      metadata: { sessionId, tools: toolDetails },
    });
  }

  private async finalizeChatTurn(
    actorId: string,
    sessionId: string,
    event: any,
  ) {
    const messages = (event as any).response?.messages || [];

    for (const message of messages) {
      await this.memoryService.appendMessage(sessionId, {
        sessionId,
        role: message.role as any,
        content: typeof message.content === "string" ? message.content : "",
        parts: Array.isArray(message.content) ? message.content : undefined,
      });
    }

    await this.auditService.log({
      actorId,
      event: AUDIT_EVENTS.CHAT_RESPONSE_GENERATED,
      metadata: {
        finishReason: event.finishReason,
        sessionId,
        stepCount: event.steps.length,
        totalUsage: event.totalUsage,
      },
    });
  }
}
