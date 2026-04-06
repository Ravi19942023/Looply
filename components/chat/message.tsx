"use client";
import type { UseChatHelpers } from "@ai-sdk/react";
import type { Vote } from "@/lib/db/schema";
import type { ChatMessage } from "@/lib/types";
import { cn, sanitizeText } from "@/lib/utils";
import { MessageContent, MessageResponse } from "../ai-elements/message";
import { Tool, ToolContent, ToolHeader, ToolOutput } from "../ai-elements/tool";
import { AnalyticsSummaryCard } from "./analytics-summary-card";
import { AssistantActivity } from "./assistant-activity";
import { CampaignApprovalCard } from "./campaign-approval-card";
import { CampaignDraftCard } from "./campaign-draft-card";
import { CampaignSentCard } from "./campaign-sent-card";
import { CustomerResultsCard } from "./customer-results-card";
import { useDataStream } from "./data-stream-provider";
import { DocumentToolResult } from "./document";
import { DocumentPreview } from "./document-preview";
import { SparklesIcon } from "./icons";
import { KnowledgeResultsCard } from "./knowledge-results-card";
import { MemoryCard } from "./memory-card";
import { MessageActions } from "./message-actions";
import { MessageReasoning } from "./message-reasoning";
import { PreviewAttachment } from "./preview-attachment";
import { ToolActivityCard } from "./tool-activity-card";
import { Weather } from "./weather";

function toSentenceCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatToolLabel(type: string) {
  return type
    .replace(/^tool-/, "")
    .replace(/([A-Z])/g, " $1")
    .replace(/-/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function summarizeToolInput(input: unknown): string | undefined {
  if (!input || typeof input !== "object") {
    return undefined;
  }

  const entries = Object.entries(input as Record<string, unknown>)
    .filter(
      ([, value]) => value !== undefined && value !== null && value !== ""
    )
    .slice(0, 3)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${toSentenceCase(key)}: ${value.length} item${value.length === 1 ? "" : "s"}`;
      }

      if (typeof value === "object") {
        return `${toSentenceCase(key)}: provided`;
      }

      return `${toSentenceCase(key)}: ${String(value)}`;
    });

  return entries.length > 0 ? entries.join(" • ") : undefined;
}

const PurePreviewMessage = ({
  addToolApprovalResponse,
  chatId,
  message,
  vote,
  isLoading,
  setMessages: _setMessages,
  regenerate: _regenerate,
  isReadonly,
  requiresScrollPadding: _requiresScrollPadding,
  onEdit,
}: {
  addToolApprovalResponse: UseChatHelpers<ChatMessage>["addToolApprovalResponse"];
  chatId: string;
  message: ChatMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  regenerate: UseChatHelpers<ChatMessage>["regenerate"];
  isReadonly: boolean;
  requiresScrollPadding: boolean;
  onEdit?: (message: ChatMessage) => void;
}) => {
  const attachmentsFromMessage = message.parts.filter(
    (part) => part.type === "file"
  );

  useDataStream();

  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  const hasAnyContent = message.parts?.some(
    (part) =>
      (part.type === "text" && part.text?.trim().length > 0) ||
      (part.type === "reasoning" &&
        "text" in part &&
        part.text?.trim().length > 0) ||
      part.type.startsWith("tool-")
  );
  const isThinking = isAssistant && isLoading && !hasAnyContent;

  const attachments = attachmentsFromMessage.length > 0 && (
    <div
      className="flex flex-row justify-end gap-2"
      data-testid={"message-attachments"}
    >
      {attachmentsFromMessage.map((attachment) => (
        <PreviewAttachment
          attachment={{
            name: attachment.filename ?? "file",
            contentType: attachment.mediaType,
            url: attachment.url,
          }}
          key={attachment.url}
        />
      ))}
    </div>
  );

  const mergedReasoning = message.parts?.reduce(
    (acc, part) => {
      if (part.type === "reasoning" && part.text?.trim().length > 0) {
        return {
          text: acc.text ? `${acc.text}\n\n${part.text}` : part.text,
          isStreaming: "state" in part ? part.state === "streaming" : false,
          rendered: false,
        };
      }
      return acc;
    },
    { text: "", isStreaming: false, rendered: false }
  ) ?? { text: "", isStreaming: false, rendered: false };

  const parts = message.parts?.map((part, index) => {
    const { type } = part;
    const key = `message-${message.id}-part-${index}`;

    if (type === "reasoning") {
      if (!mergedReasoning.rendered && mergedReasoning.text) {
        mergedReasoning.rendered = true;
        return (
          <MessageReasoning
            isLoading={isLoading || mergedReasoning.isStreaming}
            key={key}
            reasoning={mergedReasoning.text}
          />
        );
      }
      return null;
    }

    if (type === "text") {
      return (
        <MessageContent
          className={cn("text-[13px] leading-[1.65]", {
            "w-fit max-w-[min(80%,56ch)] overflow-hidden break-words rounded-2xl rounded-br-lg border border-border/30 bg-gradient-to-br from-secondary to-muted px-3.5 py-2 shadow-[var(--shadow-card)]":
              message.role === "user",
          })}
          data-testid="message-content"
          key={key}
        >
          <MessageResponse>{sanitizeText(part.text)}</MessageResponse>
        </MessageContent>
      );
    }

    if (type === "tool-getWeather") {
      const { toolCallId, state } = part;
      const approvalId = (part as { approval?: { id: string } }).approval?.id;
      const isDenied =
        state === "output-denied" ||
        (state === "approval-responded" &&
          (part as { approval?: { approved?: boolean } }).approval?.approved ===
            false);
      const widthClass = "w-[min(100%,450px)]";

      if (state === "output-available") {
        return (
          <div className={widthClass} key={toolCallId}>
            <Weather weatherAtLocation={part.output} />
          </div>
        );
      }

      if (isDenied) {
        return (
          <div className={widthClass} key={toolCallId}>
            <Tool className="w-full" defaultOpen={true}>
              <ToolHeader state="output-denied" type="tool-getWeather" />
              <ToolContent>
                <div className="px-4 py-3 text-muted-foreground text-sm">
                  Weather lookup was denied.
                </div>
              </ToolContent>
            </Tool>
          </div>
        );
      }

      if (state === "approval-responded") {
        return (
          <ToolActivityCard
            className={widthClass}
            detail={summarizeToolInput(part.input)}
            key={toolCallId}
            state={state}
            title="Weather Lookup"
          />
        );
      }

      return (
        <div className={widthClass} key={toolCallId}>
          <Tool className="w-full" defaultOpen={true}>
            <ToolHeader state={state} type="tool-getWeather" />
            <ToolContent>
              {(state === "input-available" ||
                state === "approval-requested") && (
                <ToolActivityCard
                  detail={summarizeToolInput(part.input)}
                  state={state}
                  title="Weather Lookup"
                />
              )}
              {state === "approval-requested" && approvalId && (
                <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
                  <button
                    className="rounded-md px-3 py-1.5 text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground"
                    onClick={() => {
                      addToolApprovalResponse({
                        id: approvalId,
                        approved: false,
                        reason: "User denied weather lookup",
                      });
                    }}
                    type="button"
                  >
                    Deny
                  </button>
                  <button
                    className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground text-sm transition-colors hover:bg-primary/90"
                    onClick={() => {
                      addToolApprovalResponse({
                        id: approvalId,
                        approved: true,
                      });
                    }}
                    type="button"
                  >
                    Allow
                  </button>
                </div>
              )}
            </ToolContent>
          </Tool>
        </div>
      );
    }

    if (type === "tool-createDocument") {
      const { toolCallId } = part;

      if (part.output && "error" in part.output) {
        return (
          <div
            className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-500 dark:bg-red-950/50"
            key={toolCallId}
          >
            Error creating document: {String(part.output.error)}
          </div>
        );
      }

      return (
        <DocumentPreview
          isReadonly={isReadonly}
          key={toolCallId}
          result={part.output}
        />
      );
    }

    if (type === "tool-updateDocument") {
      const { toolCallId } = part;

      if (part.output && "error" in part.output) {
        return (
          <div
            className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-500 dark:bg-red-950/50"
            key={toolCallId}
          >
            Error updating document: {String(part.output.error)}
          </div>
        );
      }

      return (
        <div className="relative" key={toolCallId}>
          <DocumentPreview
            args={{ ...part.output, isUpdate: true }}
            isReadonly={isReadonly}
            result={part.output}
          />
        </div>
      );
    }

    if (type === "tool-requestSuggestions") {
      const { toolCallId, state } = part;

      return state === "output-available" ? (
        <Tool
          className="w-[min(100%,450px)]"
          defaultOpen={true}
          key={toolCallId}
        >
          <ToolHeader state={state} type="tool-requestSuggestions" />
          <ToolContent>
            <ToolOutput
              errorText={undefined}
              output={
                "error" in part.output ? (
                  <div className="rounded border p-2 text-red-500">
                    Error: {String(part.output.error)}
                  </div>
                ) : (
                  <DocumentToolResult
                    isReadonly={isReadonly}
                    result={part.output}
                    type="request-suggestions"
                  />
                )
              }
            />
          </ToolContent>
        </Tool>
      ) : (
        <ToolActivityCard
          detail={summarizeToolInput(part.input)}
          key={toolCallId}
          state={state}
          title="Suggestions Review"
        />
      );
    }

    if (type === "tool-sendCampaign") {
      const { toolCallId, state } = part;

      if (
        state === "output-available" &&
        part.output &&
        "requiresApproval" in part.output &&
        "campaign" in part.output &&
        part.output.campaign
      ) {
        const campaign = part.output.campaign;
        return (
          <CampaignApprovalCard
            campaignId={campaign.id}
            key={toolCallId}
            name={campaign.name}
            recipientCount={campaign.recipientCount}
            recipients={campaign.recipients}
            segment={campaign.segment}
            status={campaign.status}
            subject={campaign.subject}
          />
        );
      }

      if (
        state === "output-available" &&
        part.output &&
        typeof part.output === "object" &&
        "success" in part.output &&
        "campaign" in part.output &&
        part.output.campaign
      ) {
        const campaign = part.output.campaign;
        return (
          <CampaignSentCard
            deliveredCount={part.output.deliveredCount ?? 0}
            failedCount={part.output.failedCount ?? 0}
            key={toolCallId}
            name={campaign.name}
            provider={part.output.provider}
            recipientCount={campaign.recipientCount}
            recipients={campaign.recipients}
            segment={campaign.segment}
            sentAt={campaign.sentAt}
            status={campaign.status}
            subject={campaign.subject}
          />
        );
      }

      return state === "output-available" ? (
        <Tool
          className="w-[min(100%,520px)]"
          defaultOpen={true}
          key={toolCallId}
        >
          <ToolHeader state={state} type="tool-sendCampaign" />
          <ToolContent>
            <ToolOutput
              errorText={
                part.output && "error" in part.output
                  ? String(part.output.error)
                  : undefined
              }
              output={part.output}
            />
          </ToolContent>
        </Tool>
      ) : (
        <ToolActivityCard
          detail={summarizeToolInput(part.input)}
          key={toolCallId}
          state={state}
          title="Campaign Delivery"
        />
      );
    }

    if (type === "tool-createCampaign") {
      const { toolCallId, state } = part;

      if (
        state === "output-available" &&
        part.output &&
        typeof part.output === "object" &&
        "name" in part.output &&
        "subject" in part.output &&
        "segment" in part.output
      ) {
        const campaign = part.output as {
          name: string;
          recipientCount: number | null;
          recipients?: { email: string; name: string }[] | null;
          segment: string;
          status: string;
          subject: string;
        };

        return (
          <CampaignDraftCard
            key={toolCallId}
            name={campaign.name}
            recipientCount={campaign.recipientCount}
            recipients={campaign.recipients}
            segment={campaign.segment}
            status={campaign.status}
            subject={campaign.subject}
          />
        );
      }

      return (
        <ToolActivityCard
          detail={summarizeToolInput(part.input)}
          key={toolCallId}
          state={state}
          title="Campaign Draft"
        />
      );
    }

    if (
      type === "tool-getTopCustomers" ||
      type === "tool-getChurnRiskCustomers" ||
      type === "tool-searchCustomers"
    ) {
      const { toolCallId, state } = part;

      if (state === "output-available" && Array.isArray(part.output)) {
        return (
          <CustomerResultsCard
            customers={
              part.output as Array<{
                avgOrderValue?: string | number | null;
                email: string;
                ltv?: string | number | null;
                name: string;
                orderCount?: number | null;
                segment?: string | null;
                totalRevenue?: string | number | null;
              }>
            }
            key={toolCallId}
            title={
              type === "tool-getTopCustomers"
                ? "Top Customers"
                : type === "tool-getChurnRiskCustomers"
                  ? "Churn Risk Customers"
                  : "Customer Search Results"
            }
          />
        );
      }

      return state === "output-available" ? (
        <Tool
          className="w-[min(100%,520px)]"
          defaultOpen={true}
          key={toolCallId}
        >
          <ToolHeader state={state} type={type} />
          <ToolContent>
            <ToolOutput errorText={undefined} output={part.output} />
          </ToolContent>
        </Tool>
      ) : (
        <ToolActivityCard
          detail={summarizeToolInput(part.input)}
          key={toolCallId}
          state={state}
          title={
            type === "tool-getTopCustomers"
              ? "Top Customer Analysis"
              : type === "tool-getChurnRiskCustomers"
                ? "Churn Risk Scan"
                : "Customer Search"
          }
        />
      );
    }

    if (type === "tool-getAnalyticsSummary") {
      const { toolCallId, state } = part;

      if (
        state === "output-available" &&
        part.output &&
        typeof part.output === "object" &&
        "kpis" in part.output &&
        "recentOrders" in part.output
      ) {
        return (
          <AnalyticsSummaryCard
            key={toolCallId}
            summary={
              part.output as {
                days: number;
                kpis: Array<{ format: string; label: string; value: number }>;
                recentOrders: Array<{
                  amount: string | number;
                  createdAt?: Date | string;
                  id: string;
                  product: string;
                  status: string;
                }>;
              }
            }
          />
        );
      }

      return state === "output-available" ? (
        <Tool
          className="w-[min(100%,520px)]"
          defaultOpen={true}
          key={toolCallId}
        >
          <ToolHeader state={state} type={type} />
          <ToolContent>
            <ToolOutput errorText={undefined} output={part.output} />
          </ToolContent>
        </Tool>
      ) : (
        <ToolActivityCard
          detail={summarizeToolInput(part.input)}
          key={toolCallId}
          state={state}
          title="Analytics Summary"
        />
      );
    }

    if (type === "tool-retrieveKnowledgeContext") {
      const { toolCallId, state } = part;

      if (state === "output-available" && Array.isArray(part.output)) {
        return (
          <KnowledgeResultsCard
            key={toolCallId}
            results={
              part.output as Array<{
                fileName?: string;
                id: string;
                scope?: "global" | "session";
                score?: number;
                text: string;
                title?: string;
              }>
            }
          />
        );
      }

      return state === "output-available" ? (
        <Tool
          className="w-[min(100%,520px)]"
          defaultOpen={true}
          key={toolCallId}
        >
          <ToolHeader state={state} type={type} />
          <ToolContent>
            <ToolOutput errorText={undefined} output={part.output} />
          </ToolContent>
        </Tool>
      ) : (
        <ToolActivityCard
          detail={summarizeToolInput(part.input)}
          key={toolCallId}
          state={state}
          title="Knowledge Lookup"
        />
      );
    }

    if (
      type === "tool-storeUserPreference" ||
      type === "tool-recallUserContext"
    ) {
      const { toolCallId, state } = part;

      const toolOutput = "output" in part ? part.output : undefined;

      if (
        state === "output-available" &&
        toolOutput &&
        typeof toolOutput === "object"
      ) {
        const output = toolOutput as Record<string, unknown>;
        return (
          <MemoryCard
            key={toolCallId}
            title={
              type === "tool-storeUserPreference"
                ? "Preference Saved"
                : "Stored Context"
            }
            values={[
              {
                label: "Tone",
                value: output.preferredTone as string | undefined,
              },
              {
                label: "Business",
                value: output.businessType as string | undefined,
              },
              {
                label: "Context",
                value: output.customContext as string | undefined,
              },
            ]}
          />
        );
      }

      return state === "output-available" ? (
        <Tool
          className="w-[min(100%,520px)]"
          defaultOpen={true}
          key={toolCallId}
        >
          <ToolHeader state={state} type={type} />
          <ToolContent>
            <ToolOutput errorText={undefined} output={toolOutput} />
          </ToolContent>
        </Tool>
      ) : (
        <ToolActivityCard
          detail={summarizeToolInput(part.input)}
          key={toolCallId}
          state={state}
          title={
            type === "tool-storeUserPreference"
              ? "Saving Preference"
              : "Recalling Context"
          }
        />
      );
    }

    if (type.startsWith("tool-")) {
      const toolCallId =
        "toolCallId" in part ? part.toolCallId : `${message.id}-${index}`;
      const state = "state" in part ? part.state : "input-available";
      const toolInput = "input" in part ? part.input : undefined;
      const toolOutput = "output" in part ? part.output : undefined;

      return state === "output-available" ? (
        <Tool
          className="w-[min(100%,520px)]"
          defaultOpen={true}
          key={toolCallId}
        >
          <ToolHeader state={state} type={type as any} />
          <ToolContent>
            <ToolOutput
              errorText={
                toolOutput &&
                typeof toolOutput === "object" &&
                "error" in toolOutput
                  ? String((toolOutput as { error?: unknown }).error)
                  : undefined
              }
              output={toolOutput}
            />
          </ToolContent>
        </Tool>
      ) : (
        <ToolActivityCard
          detail={summarizeToolInput(toolInput)}
          key={toolCallId}
          state={state}
          title={formatToolLabel(type)}
        />
      );
    }

    return null;
  });

  const actions = !isReadonly && (
    <MessageActions
      chatId={chatId}
      isLoading={isLoading}
      key={`action-${message.id}`}
      message={message}
      onEdit={onEdit ? () => onEdit(message) : undefined}
      vote={vote}
    />
  );

  const content = isThinking ? (
    <AssistantActivity isLoading={true} parts={message.parts} />
  ) : (
    <>
      {attachments}
      {parts}
      {actions}
    </>
  );

  return (
    <div
      className={cn(
        "group/message w-full",
        !isAssistant && "animate-[fade-up_0.25s_cubic-bezier(0.22,1,0.36,1)]"
      )}
      data-role={message.role}
      data-testid={`message-${message.role}`}
    >
      <div
        className={cn(
          isUser ? "flex flex-col items-end gap-2" : "flex items-start gap-3"
        )}
      >
        {isAssistant && (
          <div className="flex h-[calc(13px*1.65)] shrink-0 items-center">
            <div className="flex size-7 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground ring-1 ring-border/50">
              <SparklesIcon size={13} />
            </div>
          </div>
        )}
        {isAssistant ? (
          <div className="flex min-w-0 flex-1 flex-col gap-2">{content}</div>
        ) : (
          content
        )}
      </div>
    </div>
  );
};

export const PreviewMessage = PurePreviewMessage;

export const ThinkingMessage = () => {
  return (
    <div
      className="group/message w-full"
      data-role="assistant"
      data-testid="message-assistant-loading"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-[calc(13px*1.65)] shrink-0 items-center">
          <div className="flex size-7 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground ring-1 ring-border/50">
            <SparklesIcon size={13} />
          </div>
        </div>

        <AssistantActivity isLoading={true} />
      </div>
    </div>
  );
};
