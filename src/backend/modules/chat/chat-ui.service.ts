import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  type UIMessageStreamWriter,
  type OnFinishEvent,
  type OnStepFinishEvent,
  type UIMessagePart,
} from "ai";

import { generateUUID } from "@/lib/utils";
import { buildChatTitle, getMessageText, getToolDisplayName } from "./chat-ui.utils";
import { ensureBootstrap } from "@/backend/lib/bootstrap";
import type { AnalyticsService } from "@/backend/modules/analytics";
import type { CampaignService } from "@/backend/modules/campaigns";
import { chatSystemPromptTemplate } from "@/backend/lib/prompts/chat-system.prompt";
import type { PromptContext, UserMemorySnapshot } from "@/backend/modules/chat/prompt-builder.types";
import { CHAT_MAX_STEPS, CHAT_MODEL } from "@/backend/modules/chat/chat.constants";
import { getLanguageModel } from "@/lib/ai/providers";
import { buildAllTools, buildArtifactTools } from "@/backend/modules/chat/tools";
import { artifactsPromptTemplate } from "@/backend/lib/prompts/artifact.prompt";
import type { CustomerService } from "@/backend/modules/customers";
import type { MemoryService } from "@/backend/modules/memory";
import type { RagService } from "@/backend/modules/rag";
import type { TelemetryService } from "@/backend/modules/telemetry";
import {
  updateChatTitleById,
  getChatById,
  getMessageCountByUserId,
  getMessagesByChatId,
  saveChat,
  saveMessages
} from "@/lib/db/queries";
import type { ChatMessage, TokenUsageAnnotation, CustomUIDataTypes } from "@/lib/types";
import { ChatbotError } from "@/lib/errors";

/**
 * Interface for chat orchestration dependencies.
 */
interface ChatDependencies {
  chatService: {
    appendUserMessage: (sessionId: string, content: string) => Promise<void>;
    appendAssistantMessage: (sessionId: string, content: string) => Promise<void>;
  };
  customerService: CustomerService;
  campaignService: CampaignService;
  analyticsService: AnalyticsService;
  ragService: RagService;
  memoryService: MemoryService;
  telemetryService: TelemetryService;
}

/**
 * Main entry point for streaming UI chat.
 */
export async function streamUiChat({
  actorId,
  messages,
  chatId,
}: {
  actorId: string;
  messages: ChatMessage[];
  chatId: string;
}) {
  const deps = await resolveDependencies();
  const latestUserMessage = validateAndGetLatestUserMessage(messages);
  const latestUserText = getMessageText(latestUserMessage);

  // Initialize chat session, check limits, and persist the incoming user message
  const { isNewChat, persistedMessageIds } = await initializeChatSession({
    actorId,
    chatId,
    latestUserMessage,
    messages
  });

  // Track the user message in the high-level chat service
  await deps.chatService.appendUserMessage(chatId, latestUserText);

  // Prepare required context (RAG, User Memory, Conversation Summary)
  const promptContext = await preparePromptContext({
    actorId,
    chatId,
    latestUserText,
    messages,
    deps
  });

  const baseSystemPrompt = chatSystemPromptTemplate(promptContext);
  const sanitizedMessages = sanitizeMessageParts(messages);
  const modelMessages = await convertToModelMessages(sanitizedMessages);

  const stream = createUIMessageStream({
    generateId: generateUUID,
    execute: async ({ writer }) => {
      const tools = {
        ...buildAllTools(deps, actorId, chatId),
        ...buildArtifactTools({
          actorId,
          chatId,
          dataStream: writer as any,
          modelId: CHAT_MODEL,
        }),
      };

      // Set up streaming event handlers
      const { handleStepFinish, handleFinish } = createStreamHandlers({
        writer,
        actorId,
        chatId,
        telemetryService: deps.telemetryService
      });

      const result = streamText({
        model: getLanguageModel(CHAT_MODEL),
        system: `${baseSystemPrompt}\n\n${artifactsPromptTemplate}`,
        messages: modelMessages,
        tools,
        stopWhen: stepCountIs(CHAT_MAX_STEPS),
        onStepFinish: handleStepFinish,
        onFinish: handleFinish,
      });

      // Merge the LLM stream into the UI message stream
      writer.merge(result.toUIMessageStream());
    },
    onFinish: ({ messages: finishedMessages }) => persistChatCompletion({
      finishedMessages: finishedMessages as ChatMessage[],
      chatId,
      actorId,
      isNewChat,
      latestUserMessage,
      persistedMessageIds,
      deps
    }),
  });

  return createUIMessageStreamResponse({ stream });
}

/**
 * Resolves all required services from the container.
 */
async function resolveDependencies(): Promise<ChatDependencies> {
  const container = await ensureBootstrap();
  return {
    chatService: container.resolve("ChatService"),
    customerService: container.resolve("CustomerService"),
    campaignService: container.resolve("CampaignService"),
    analyticsService: container.resolve("AnalyticsService"),
    ragService: container.resolve("RagService"),
    memoryService: container.resolve("MemoryService"),
    telemetryService: container.resolve("TelemetryService"),
  };
}

/**
 * Ensures a valid user message exists and returns it.
 */
function validateAndGetLatestUserMessage(messages: ChatMessage[]): ChatMessage {
  const message = [...messages].reverse().find((m) => m.role === "user");
  if (!message) {
    throw new ChatbotError("bad_request:chat", "A user message is required.");
  }
  return message;
}

async function initializeChatSession({
  actorId,
  chatId,
  latestUserMessage,
  messages
}: {
  actorId: string;
  chatId: string;
  latestUserMessage: ChatMessage;
  messages: ChatMessage[];
}) {
  const [existingChat, messageCount, persistedMessages] = await Promise.all([
    getChatById({ id: chatId }),
    getMessageCountByUserId({ actorId, differenceInHours: 1 }),
    getMessagesByChatId({ id: chatId }),
  ]);

  if (messageCount > 100) {
    throw new ChatbotError("rate_limit:chat");
  }

  const isNewChat = !existingChat;
  if (isNewChat) {
    await saveChat({
      id: chatId,
      actorId,
      title: buildChatTitle(latestUserMessage),
    });
  }

  const persistedMessageIds = new Set(persistedMessages.map((m) => m.id));

  // If the latest user message isn't in DB yet, save it
  if (!persistedMessageIds.has(latestUserMessage.id)) {
    await saveMessages({
      messages: [
        {
          id: latestUserMessage.id,
          chatId,
          role: latestUserMessage.role,
          parts: latestUserMessage.parts,
          attachments: (latestUserMessage.attachments || []).map((a) => ({
            name: a.name || "File",
            url: a.url,
            contentType: a.contentType || "application/octet-stream",
          })),
          annotations: latestUserMessage.annotations || [],
          createdAt: new Date(),
        },
      ],
    });
  }

  return { isNewChat, persistedMessageIds };
}

/**
 * Aggregates RAG context, memory, and summaries for the prompt.
 */
async function preparePromptContext({
  actorId,
  chatId,
  latestUserText,
  messages,
  deps
}: {
  actorId: string;
  chatId: string;
  latestUserText: string;
  messages: ChatMessage[];
  deps: ChatDependencies;
}): Promise<PromptContext> {
  const [memory, windowResult] = await Promise.all([
    deps.memoryService.getMemory(actorId),
    deps.memoryService.getContextWindow(chatId),
  ]);

  let ragContext: string | null = null;
  try {
    const chunks = await deps.ragService.retrieveContextForQuery(actorId, latestUserText, { chatId });
    ragContext = deps.ragService.formatContextForPrompt(chunks);
  } catch (error) {
    // Graceful fallback for RAG failures to ensure conversation continues
    console.error(`[ChatService] RAG retrieval failed: ${error}`);
  }

  const summary = windowResult.droppedCount > 0
    ? await deps.memoryService
      .getContextWindowManager()
      .compressSummary(windowResult.messages.slice(0, windowResult.droppedCount), null)
    : null;

  const userMemory: UserMemorySnapshot | null = memory
    ? {
      preferredTone: memory.preferredTone,
      businessType: memory.businessType,
      typicalCampaigns: memory.typicalCampaigns,
      customContext: memory.customContext,
    }
    : null;

  // Extract unique session files from attachments across the conversation
  const sessionFiles = Array.from(
    messages
      .flatMap((m) => m.attachments || [])
      .filter((a) => !!a.name && !!a.url)
      .reduce((map, a) => map.set(a.url, { fileName: a.name!, id: a.url }), new Map<string, { fileName: string; id: string }>())
      .values()
  );

  return {
    ragContext,
    userMemory,
    conversationSummary: summary,
    availableTools: [],
    currentDate: new Date().toISOString().slice(0, 10),
    sessionId: chatId,
    sessionFiles,
  };
}

function sanitizeMessageParts(messages: ChatMessage[]): ChatMessage[] {
  return messages.map((msg) => {
    if (!msg.parts) return msg;
    const cleanParts = msg.parts.map((p) => {
      if (p.type === "tool-call") {
        const part = p as any;
        if (part.args === undefined && part.input === undefined) {
          return { ...p, args: {} };
        }
      }
      return p;
    });

    return { ...msg, parts: cleanParts as ChatMessage["parts"] };
  });
}

/**
 * Creates onStepFinish and onFinish handlers for the stream with telemetry and annotations.
 */
function createStreamHandlers({
  writer,
  actorId,
  chatId,
  telemetryService
}: {
  writer: UIMessageStreamWriter<any>;
  actorId: string;
  chatId: string;
  telemetryService: TelemetryService;
}) {
  /** Helper for writing annotations with runtime safety checks */
  const writeAnnotation = (annotation: any) => {
    const w = writer as any;
    if (typeof w.writeMessageAnnotation === 'function') {
      w.writeMessageAnnotation(annotation);
    } else if (typeof w.appendMessageAnnotation === 'function') {
      w.appendMessageAnnotation(annotation);
    }
  };

  const handleStepFinish = async ({ toolCalls, toolResults }: OnStepFinishEvent<any>) => {
    if (!toolCalls || toolCalls.length === 0) return;

    const logs = toolCalls.map(async (call) => {
      const result = toolResults?.find((r) => r.toolCallId === call.toolCallId);
      const callInput = (call as any).input ?? {};
      const resultOutput = (result as any)?.output ?? {};

      // Inject tool metadata for UI labels and icons
      writeAnnotation({
        type: "tool-metadata",
        toolCallId: call.toolCallId,
        toolName: call.toolName,
        displayName: getToolDisplayName(call.toolName),
      });

      // Log tool usage for analytics and auditing
      await telemetryService.logToolUsage({
        chatId,
        toolName: call.toolName,
        input: callInput as Record<string, unknown>,
        output: resultOutput as Record<string, unknown>,
        stepIndex: 0,
      });
    });

    await Promise.all(logs);
  };

  const handleFinish = async ({ usage }: OnFinishEvent<any>) => {
    if (!usage) return;

    const { promptTokens = 0, completionTokens = 0, totalTokens = 0 } = usage as any;

    await telemetryService.logTokenUsage({
      actorId,
      chatId,
      source: "llm:chat",
      model: CHAT_MODEL,
      promptTokens,
      completionTokens,
      totalTokens,
    });

    // Provide token usage for UI consumption
    writeAnnotation({
      type: "token-usage",
      promptTokens,
      completionTokens,
      totalTokens,
    } as TokenUsageAnnotation);
  };

  return { handleStepFinish, handleFinish };
}

/**
 * Persists the final stream results, assistant messages, and updates conversation state.
 */
async function persistChatCompletion({
  finishedMessages,
  chatId,
  actorId,
  isNewChat,
  latestUserMessage,
  persistedMessageIds,
  deps
}: {
  finishedMessages: ChatMessage[];
  chatId: string;
  actorId: string;
  isNewChat: boolean;
  latestUserMessage: ChatMessage;
  persistedMessageIds: Set<string>;
  deps: ChatDependencies;
}) {
  const lastAssistantMessage = finishedMessages.at(-1);
  const assistantText = getMessageText(lastAssistantMessage);

  // Save any new messages generated during the stream
  const newMessages = finishedMessages.filter((m) => !persistedMessageIds.has(m.id));

  if (newMessages.length > 0) {
    await saveMessages({
      messages: newMessages.map((m) => ({
        id: m.id,
        chatId,
        role: m.role as "user" | "assistant" | "system" | "data" | "tool",
        parts: m.parts,
        attachments: (m.attachments || []).map((a: any) => ({
          name: a.name || "File",
          url: a.url || "#",
          contentType: a.contentType || "application/octet-stream",
        })),
        annotations: m.annotations || [],
        createdAt: new Date(),
      })),
    });
  }

  // Update chat state tracker
  if (assistantText) {
    await deps.chatService.appendAssistantMessage(chatId, assistantText);
  }

  // Update title for new chats
  if (isNewChat) {
    await updateChatTitleById({
      chatId,
      title: buildChatTitle(latestUserMessage),
    });
  }
}
