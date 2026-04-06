import { geolocation, ipAddress } from "@vercel/functions";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId,
  stepCountIs,
  streamText,
} from "ai";
import { checkBotId } from "botid/server";
import { after } from "next/server";
import { createResumableStreamContext } from "resumable-stream";
import { auth, type UserType } from "@/app/(auth)/auth";
import { entitlementsByUserType } from "@/lib/ai/entitlements";
import {
  chatModels,
  DEFAULT_CHAT_MODEL,
  getCapabilities,
} from "@/lib/ai/models";
import { type RequestHints, systemPrompt } from "@/lib/ai/prompts";
import { getLanguageModel } from "@/lib/ai/providers";
import { createCampaign } from "@/lib/ai/tools/create-campaign";
import { createDocument } from "@/lib/ai/tools/create-document";
import { editDocument } from "@/lib/ai/tools/edit-document";
import { getAnalyticsSummaryTool } from "@/lib/ai/tools/get-analytics-summary";
import { getChurnRiskCustomersTool } from "@/lib/ai/tools/get-churn-risk-customers";
import { getCustomerLTVTool } from "@/lib/ai/tools/get-customer-ltv";
import { getTopCustomersTool } from "@/lib/ai/tools/get-top-customers";
import { getWeather } from "@/lib/ai/tools/get-weather";
import { recallUserContext } from "@/lib/ai/tools/recall-user-context";
import { requestSuggestions } from "@/lib/ai/tools/request-suggestions";
import { retrieveKnowledgeContextTool } from "@/lib/ai/tools/retrieve-knowledge-context";
import { searchCustomersTool } from "@/lib/ai/tools/search-customers";
import { sendCampaign } from "@/lib/ai/tools/send-campaign";
import { storeUserPreference } from "@/lib/ai/tools/store-user-preference";
import { updateDocument } from "@/lib/ai/tools/update-document";
import { isProductionEnvironment } from "@/lib/constants";
import {
  createStreamId,
  createUsageLog,
  deleteChatById,
  getChatById,
  getMessageCountByUserId,
  getMessagesByChatId,
  saveChat,
  saveMessages,
  updateChatTitleById,
  updateMessage,
} from "@/lib/db/queries";
import type { DBMessage } from "@/lib/db/schema";
import { ChatbotError } from "@/lib/errors";
import { retrieveKnowledgeContext as retrieveKnowledgeContextDirect } from "@/lib/rag/service";
import { checkRateLimit } from "@/lib/ratelimit";
import type { ChatMessage } from "@/lib/types";
import { convertToUIMessages, generateUUID } from "@/lib/utils";
import { generateTitleFromUserMessage } from "../../actions";
import { type PostRequestBody, postRequestBodySchema } from "./schema";

export const maxDuration = 60;

function getUserTextFromMessage(message?: ChatMessage) {
  if (!message || message.role !== "user") {
    return "";
  }

  return message.parts
    .filter(
      (
        part
      ): part is Extract<(typeof message.parts)[number], { type: "text" }> =>
        part.type === "text"
    )
    .map((part) => part.text)
    .join(" ")
    .trim();
}

function isKnowledgeLookupIntent(text: string) {
  if (!text) {
    return false;
  }

  const normalized = text.toLowerCase();

  if (
    /\b(uploaded file|knowledge base|playbook|policy|portal|document|docs?)\b/.test(
      normalized
    )
  ) {
    return true;
  }

  return /^(what is|who is|where is|tell me about|explain)\b/.test(normalized);
}

function getNonImageFileNamesFromMessage(message?: ChatMessage) {
  if (!message || message.role !== "user") {
    return [];
  }

  return message.parts
    .filter(
      (
        part
      ): part is Extract<(typeof message.parts)[number], { type: "file" }> =>
        part.type === "file" && !part.mediaType.startsWith("image/")
    )
    .map((part) => {
      if ("name" in part && typeof part.name === "string" && part.name) {
        return part.name;
      }

      if ("filename" in part && part.filename) {
        return part.filename;
      }

      return "";
    })
    .filter(Boolean);
}

function sanitizeMessagesForModel(messages: ChatMessage[]): ChatMessage[] {
  return messages.map((message) => ({
    ...message,
    parts: message.parts.filter((part) => {
      if (part.type !== "file") {
        return true;
      }

      return part.mediaType.startsWith("image/");
    }),
  }));
}

function getStreamContext() {
  try {
    return createResumableStreamContext({ waitUntil: after });
  } catch (_) {
    return null;
  }
}

export { getStreamContext };

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (_) {
    return new ChatbotError("bad_request:api").toResponse();
  }

  try {
    const { id, message, messages, selectedVisibilityType } = requestBody;

    const [, session] = await Promise.all([
      checkBotId().catch(() => null),
      auth(),
    ]);

    if (!session?.user) {
      return new ChatbotError("unauthorized:chat").toResponse();
    }

    const chatModel = requestBody.selectedChatModel ?? DEFAULT_CHAT_MODEL;

    await checkRateLimit({
      ip: ipAddress(request),
      userId: session.user.id,
    });

    const userType: UserType = session.user.role as UserType;

    const messageCount = await getMessageCountByUserId({
      id: session.user.id,
      differenceInHours: 1,
    });

    if (messageCount > entitlementsByUserType[userType].maxMessagesPerHour) {
      return new ChatbotError("rate_limit:chat").toResponse();
    }

    const isToolApprovalFlow = Boolean(messages);

    const chat = await getChatById({ id });
    let messagesFromDb: DBMessage[] = [];
    let titlePromise: Promise<string> | null = null;

    if (chat) {
      if (chat.userId !== session.user.id) {
        return new ChatbotError("forbidden:chat").toResponse();
      }
      const chatHistoryLimit = Number.parseInt(
        process.env.CHAT_HISTORY_LIMIT ?? "30",
        10
      );
      messagesFromDb = await getMessagesByChatId({
        id,
        limit: chatHistoryLimit,
      });
    } else if (message?.role === "user") {
      await saveChat({
        id,
        userId: session.user.id,
        title: "New chat",
        visibility: selectedVisibilityType,
      });
      titlePromise = generateTitleFromUserMessage({ message });
    }

    let uiMessages: ChatMessage[];

    if (isToolApprovalFlow && messages) {
      const dbMessages = convertToUIMessages(messagesFromDb);
      const approvalStates = new Map(
        messages.flatMap(
          (m) =>
            m.parts
              ?.filter(
                (p: Record<string, unknown>) =>
                  p.state === "approval-responded" ||
                  p.state === "output-denied"
              )
              .map((p: Record<string, unknown>) => [
                String(p.toolCallId ?? ""),
                p,
              ]) ?? []
        )
      );
      uiMessages = dbMessages.map((msg) => ({
        ...msg,
        parts: msg.parts.map((part) => {
          if (
            "toolCallId" in part &&
            approvalStates.has(String(part.toolCallId))
          ) {
            return { ...part, ...approvalStates.get(String(part.toolCallId)) };
          }
          return part;
        }),
      })) as ChatMessage[];
    } else {
      uiMessages = [
        ...convertToUIMessages(messagesFromDb),
        message as ChatMessage,
      ];
    }

    const { longitude, latitude, city, country } = geolocation(request);

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
    };

    if (message?.role === "user") {
      await saveMessages({
        messages: [
          {
            chatId: id,
            id: message.id,
            role: "user",
            parts: message.parts,
            attachments: [],
            createdAt: new Date(),
          },
        ],
      });
    }

    const modelConfig = chatModels.find((m) => m.id === chatModel);
    const modelCapabilities = await getCapabilities();
    const capabilities = modelCapabilities[chatModel];
    const isReasoningModel = capabilities?.reasoning === true;
    const supportsTools = capabilities?.tools === true;

    const latestUserText = getUserTextFromMessage(message);
    const latestFileNames = getNonImageFileNamesFromMessage(message);
    const autoRagQuery = [latestUserText, ...latestFileNames].join(" ").trim();
    const shouldAutoRetrieve =
      autoRagQuery.length > 0 &&
      !isToolApprovalFlow &&
      (isKnowledgeLookupIntent(latestUserText) || latestFileNames.length > 0);

    const autoRagContext = shouldAutoRetrieve
      ? await retrieveKnowledgeContextDirect({
          actorId: session.user.id,
          chatId: id,
          limit: 5,
          query: autoRagQuery,
        })
      : [];

    const ragContextText =
      autoRagContext.length > 0
        ? autoRagContext
            .map(
              (chunk) =>
                `### Source: ${chunk.fileName} (${chunk.scope})\n> ${chunk.text}`
            )
            .join("\n\n")
        : null;

    const modelMessages = await convertToModelMessages(
      sanitizeMessagesForModel(uiMessages)
    );
    const forceKnowledgeRetrieval =
      !isToolApprovalFlow &&
      (isKnowledgeLookupIntent(latestUserText) || latestFileNames.length > 0);

    const stream = createUIMessageStream({
      originalMessages: isToolApprovalFlow ? uiMessages : undefined,
      execute: async ({ writer: dataStream }) => {
        const result = streamText({
          model: getLanguageModel(chatModel),
          system: systemPrompt({
            ragContext: ragContextText,
            requestHints,
            supportsTools,
          }),
          messages: modelMessages,
          stopWhen: stepCountIs(Number(process.env.AI_CHAT_MAX_STEPS ?? 5)),
          experimental_activeTools:
            isReasoningModel && !supportsTools
              ? []
              : [
                  "getWeather",
                  "getTopCustomers",
                  "getCustomerLTV",
                  "getChurnRiskCustomers",
                  "searchCustomers",
                  "getAnalyticsSummary",
                  "retrieveKnowledgeContext",
                  "createDocument",
                  "editDocument",
                  "updateDocument",
                  "requestSuggestions",
                  "createCampaign",
                  "sendCampaign",
                  "storeUserPreference",
                  "recallUserContext",
                ],
          prepareStep: ({ stepNumber }) =>
            forceKnowledgeRetrieval && stepNumber === 0
              ? {
                  activeTools: ["retrieveKnowledgeContext"],
                  toolChoice: {
                    type: "tool",
                    toolName: "retrieveKnowledgeContext",
                  },
                }
              : undefined,
          providerOptions: {
            ...(modelConfig?.gatewayOrder && {
              gateway: { order: modelConfig.gatewayOrder },
            }),
            ...(modelConfig?.reasoningEffort && {
              openai: { reasoningEffort: modelConfig.reasoningEffort },
            }),
          },
          tools: {
            getWeather,
            getTopCustomers: getTopCustomersTool,
            getCustomerLTV: getCustomerLTVTool,
            getChurnRiskCustomers: getChurnRiskCustomersTool,
            searchCustomers: searchCustomersTool,
            getAnalyticsSummary: getAnalyticsSummaryTool,
            retrieveKnowledgeContext: retrieveKnowledgeContextTool({
              chatId: id,
              session,
            }),
            createDocument: createDocument({
              session,
              dataStream,
              modelId: chatModel,
            }),
            editDocument: editDocument({ dataStream, session }),
            updateDocument: updateDocument({
              session,
              dataStream,
              modelId: chatModel,
            }),
            requestSuggestions: requestSuggestions({
              session,
              dataStream,
              modelId: chatModel,
            }),
            createCampaign: createCampaign({ session }),
            sendCampaign: sendCampaign({ session }),
            storeUserPreference: storeUserPreference({ session }),
            recallUserContext: recallUserContext({ session }),
          },
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: "stream-text",
          },
          onFinish: async ({ totalUsage }) => {
            await createUsageLog({
              actorId: session.user.id,
              chatId: id,
              source: "llm:chat",
              model: chatModel,
              promptTokens: totalUsage.inputTokens ?? 0,
              completionTokens: totalUsage.outputTokens ?? 0,
              totalTokens: totalUsage.totalTokens ?? 0,
            });
          },
        });

        dataStream.merge(
          result.toUIMessageStream({ sendReasoning: isReasoningModel })
        );

        if (titlePromise) {
          const title = await titlePromise;
          dataStream.write({ type: "data-chat-title", data: title });
          updateChatTitleById({ chatId: id, title });
        }
      },
      generateId: generateUUID,
      onFinish: async ({ messages: finishedMessages }) => {
        if (isToolApprovalFlow) {
          for (const finishedMsg of finishedMessages) {
            const existingMsg = uiMessages.find((m) => m.id === finishedMsg.id);
            if (existingMsg) {
              await updateMessage({
                id: finishedMsg.id,
                parts: finishedMsg.parts,
              });
            } else {
              await saveMessages({
                messages: [
                  {
                    id: finishedMsg.id,
                    role: finishedMsg.role,
                    parts: finishedMsg.parts,
                    createdAt: new Date(),
                    attachments: [],
                    chatId: id,
                  },
                ],
              });
            }
          }
        } else if (finishedMessages.length > 0) {
          await saveMessages({
            messages: finishedMessages.map((currentMessage) => ({
              id: currentMessage.id,
              role: currentMessage.role,
              parts: currentMessage.parts,
              createdAt: new Date(),
              attachments: [],
              chatId: id,
            })),
          });
        }
      },
      onError: (error) => {
        if (
          error instanceof Error &&
          error.message?.includes(
            "AI Gateway requires a valid credit card on file to service requests"
          )
        ) {
          return "AI Gateway requires a valid credit card on file to service requests. Please visit https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%3Fmodal%3Dadd-credit-card to add a card and unlock your free credits.";
        }
        return "Oops, an error occurred!";
      },
    });

    return createUIMessageStreamResponse({
      stream,
      async consumeSseStream({ stream: sseStream }) {
        if (!process.env.REDIS_URL) {
          return;
        }
        try {
          const streamContext = getStreamContext();
          if (streamContext) {
            const streamId = generateId();
            await createStreamId({ streamId, chatId: id });
            await streamContext.createNewResumableStream(
              streamId,
              () => sseStream
            );
          }
        } catch (_) {
          /* non-critical */
        }
      },
    });
  } catch (error) {
    const vercelId = request.headers.get("x-vercel-id");

    if (error instanceof ChatbotError) {
      return error.toResponse();
    }

    if (
      error instanceof Error &&
      error.message?.includes(
        "AI Gateway requires a valid credit card on file to service requests"
      )
    ) {
      return new ChatbotError("bad_request:activate_gateway").toResponse();
    }

    console.error("Unhandled error in chat API:", error, { vercelId });
    return new ChatbotError("offline:chat").toResponse();
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new ChatbotError("bad_request:api").toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }

  const chat = await getChatById({ id });

  if (chat?.userId !== session.user.id) {
    return new ChatbotError("forbidden:chat").toResponse();
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
