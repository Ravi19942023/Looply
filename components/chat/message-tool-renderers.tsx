"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import type { ArtifactKind } from "@/lib/artifacts/types";
import type { ChatMessage } from "@/lib/types";
import { Tool, ToolContent, ToolHeader, ToolOutput } from "../ai-elements/tool";
import { AnalyticsSummaryCard } from "./analytics-summary-card";
import { CampaignApprovalCard } from "./campaign-approval-card";
import { CampaignDraftCard } from "./campaign-draft-card";
import { CampaignSentCard } from "./campaign-sent-card";
import { CustomerResultsCard } from "./customer-results-card";
import { DocumentToolResult } from "./document";
import { DocumentPreview } from "./document-preview";
import { KnowledgeResultsCard } from "./knowledge-results-card";
import { MemoryCard } from "./memory-card";
import { ToolActivityCard } from "./tool-activity-card";
import { Weather } from "./weather";

type ToolPart = ChatMessage["parts"][number];

type RenderToolPartParams = {
  addToolApprovalResponse: UseChatHelpers<ChatMessage>["addToolApprovalResponse"];
  isReadonly: boolean;
  messageId: string;
  part: ToolPart;
  partIndex: number;
};

type ToolRenderer = (params: RenderToolPartParams) => React.ReactNode;

const narrowWidthClass = "w-[min(100%,450px)]";
const wideWidthClass = "w-[min(100%,520px)]";
const customerToolTypes = new Set([
  "tool-getCustomerLTV",
  "tool-getTopCustomers",
  "tool-getChurnRiskCustomers",
  "tool-searchCustomers",
]);

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

function getToolKey(part: ToolPart, messageId: string, partIndex: number) {
  return "toolCallId" in part ? part.toolCallId : `${messageId}-${partIndex}`;
}

function getToolState(part: ToolPart) {
  return "state" in part ? part.state : "input-available";
}

function renderGenericTool(params: RenderToolPartParams) {
  const { part, messageId, partIndex } = params;
  const type = part.type;
  const toolKey = getToolKey(part, messageId, partIndex);
  const state = getToolState(part);
  const toolInput = "input" in part ? part.input : undefined;
  const toolOutput = "output" in part ? part.output : undefined;

  return state === "output-available" ? (
    <Tool className={wideWidthClass} defaultOpen={true} key={toolKey}>
      <ToolHeader state={state as never} type={type as never} />
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
      key={toolKey}
      state={state as never}
      title={formatToolLabel(type)}
    />
  );
}

const renderWeatherTool: ToolRenderer = ({
  addToolApprovalResponse,
  messageId,
  part,
  partIndex,
}) => {
  const toolKey = getToolKey(part, messageId, partIndex);
  const state = getToolState(part);
  const approvalId = (part as { approval?: { id: string } }).approval?.id;
  const isDenied =
    state === "output-denied" ||
    (state === "approval-responded" &&
      (part as { approval?: { approved?: boolean } }).approval?.approved ===
        false);

  if (state === "output-available") {
    return (
      <div className={narrowWidthClass} key={toolKey}>
        <Weather
          weatherAtLocation={(part as unknown as { output: never }).output}
        />
      </div>
    );
  }

  if (isDenied) {
    return (
      <div className={narrowWidthClass} key={toolKey}>
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
        className={narrowWidthClass}
        detail={summarizeToolInput("input" in part ? part.input : undefined)}
        key={toolKey}
        state={state as never}
        title="Weather Lookup"
      />
    );
  }

  return (
    <div className={narrowWidthClass} key={toolKey}>
      <Tool className="w-full" defaultOpen={true}>
        <ToolHeader state={state as never} type="tool-getWeather" />
        <ToolContent>
          {(state === "input-available" || state === "approval-requested") && (
            <ToolActivityCard
              detail={summarizeToolInput(
                "input" in part ? part.input : undefined
              )}
              state={state as never}
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
};

const renderCreateDocumentTool: ToolRenderer = ({
  isReadonly,
  messageId,
  part,
  partIndex,
}) => {
  const toolKey = getToolKey(part, messageId, partIndex);
  const output = "output" in part ? part.output : undefined;

  if (output && typeof output === "object" && "error" in output) {
    return (
      <div
        className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-500 dark:bg-red-950/50"
        key={toolKey}
      >
        Error creating document: {String(output.error)}
      </div>
    );
  }

  return (
    <DocumentPreview
      isReadonly={isReadonly}
      key={toolKey}
      result={
        output as {
          content?: string;
          id: string;
          kind: ArtifactKind;
          title: string;
        }
      }
    />
  );
};

const renderUpdateDocumentTool: ToolRenderer = ({
  isReadonly,
  messageId,
  part,
  partIndex,
}) => {
  const toolKey = getToolKey(part, messageId, partIndex);
  const output = "output" in part ? part.output : undefined;

  if (output && typeof output === "object" && "error" in output) {
    return (
      <div
        className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-500 dark:bg-red-950/50"
        key={toolKey}
      >
        Error updating document: {String(output.error)}
      </div>
    );
  }

  return (
    <div className="relative" key={toolKey}>
      <DocumentPreview
        args={{ ...(output as object), isUpdate: true }}
        isReadonly={isReadonly}
        result={output as never}
      />
    </div>
  );
};

const renderSuggestionsTool: ToolRenderer = ({
  isReadonly,
  messageId,
  part,
  partIndex,
}) => {
  const toolKey = getToolKey(part, messageId, partIndex);
  const state = getToolState(part);
  const output = "output" in part ? part.output : undefined;

  return state === "output-available" ? (
    <Tool className={narrowWidthClass} defaultOpen={true} key={toolKey}>
      <ToolHeader state={state as never} type="tool-requestSuggestions" />
      <ToolContent>
        <ToolOutput
          errorText={undefined}
          output={
            output && typeof output === "object" && "error" in output ? (
              <div className="rounded border p-2 text-red-500">
                Error: {String(output.error)}
              </div>
            ) : (
              <DocumentToolResult
                isReadonly={isReadonly}
                result={output as never}
                type="request-suggestions"
              />
            )
          }
        />
      </ToolContent>
    </Tool>
  ) : (
    <ToolActivityCard
      detail={summarizeToolInput("input" in part ? part.input : undefined)}
      key={toolKey}
      state={state as never}
      title="Suggestions Review"
    />
  );
};

const renderSendCampaignTool: ToolRenderer = ({
  messageId,
  part,
  partIndex,
}) => {
  const toolKey = getToolKey(part, messageId, partIndex);
  const state = getToolState(part);
  const output = "output" in part ? part.output : undefined;

  if (
    state === "output-available" &&
    output &&
    typeof output === "object" &&
    "requiresApproval" in output &&
    "campaign" in output &&
    output.campaign
  ) {
    const campaignDetails = output.campaign as {
      id: string;
      name: string;
      recipientCount: number;
      recipients?: { email: string; name: string }[] | null;
      segment: string;
      status: string;
      subject: string;
    };

    return (
      <CampaignApprovalCard
        campaignId={campaignDetails.id}
        key={toolKey}
        name={campaignDetails.name}
        recipientCount={campaignDetails.recipientCount}
        recipients={campaignDetails.recipients}
        segment={campaignDetails.segment}
        status={campaignDetails.status}
        subject={campaignDetails.subject}
      />
    );
  }

  if (
    state === "output-available" &&
    output &&
    typeof output === "object" &&
    "success" in output &&
    "campaign" in output &&
    output.campaign
  ) {
    const campaignDetails = output.campaign as {
      name: string;
      recipientCount: number;
      recipients?: { email: string; name: string }[] | null;
      segment: string;
      sentAt?: Date | string | null;
      status: string;
      subject: string;
    };

    return (
      <CampaignSentCard
        deliveredCount={Number(output.deliveredCount ?? 0)}
        failedCount={Number(output.failedCount ?? 0)}
        key={toolKey}
        name={campaignDetails.name}
        provider={String(output.provider ?? "")}
        recipientCount={campaignDetails.recipientCount}
        recipients={campaignDetails.recipients}
        segment={campaignDetails.segment}
        sentAt={campaignDetails.sentAt}
        status={campaignDetails.status}
        subject={campaignDetails.subject}
      />
    );
  }

  return state === "output-available" ? (
    <Tool className={wideWidthClass} defaultOpen={true} key={toolKey}>
      <ToolHeader state={state as never} type="tool-sendCampaign" />
      <ToolContent>
        <ToolOutput
          errorText={
            output && typeof output === "object" && "error" in output
              ? String(output.error)
              : undefined
          }
          output={output}
        />
      </ToolContent>
    </Tool>
  ) : (
    <ToolActivityCard
      detail={summarizeToolInput("input" in part ? part.input : undefined)}
      key={toolKey}
      state={state as never}
      title="Campaign Delivery"
    />
  );
};

const renderCreateCampaignTool: ToolRenderer = ({
  messageId,
  part,
  partIndex,
}) => {
  const toolKey = getToolKey(part, messageId, partIndex);
  const state = getToolState(part);
  const output = "output" in part ? part.output : undefined;

  if (
    state === "output-available" &&
    output &&
    typeof output === "object" &&
    "name" in output &&
    "subject" in output &&
    "segment" in output
  ) {
    return (
      <CampaignDraftCard
        key={toolKey}
        name={String(output.name)}
        recipientCount={Number(output.recipientCount ?? 0)}
        recipients={
          (output.recipients as { email: string; name: string }[] | null) ??
          undefined
        }
        segment={String(output.segment)}
        status={String(output.status)}
        subject={String(output.subject)}
      />
    );
  }

  return (
    <ToolActivityCard
      detail={summarizeToolInput("input" in part ? part.input : undefined)}
      key={toolKey}
      state={state as never}
      title="Campaign Draft"
    />
  );
};

const renderCustomerTool: ToolRenderer = ({ messageId, part, partIndex }) => {
  const toolKey = getToolKey(part, messageId, partIndex);
  const state = getToolState(part);
  const type = part.type;
  const output = "output" in part ? part.output : undefined;

  if (state === "output-available" && Array.isArray(output)) {
    return (
      <CustomerResultsCard
        customers={
          output as Array<{
            avgOrderValue?: string | number | null;
            email: string;
            ltv?: string | number | null;
            name: string;
            orderCount?: number | null;
            segment?: string | null;
            totalRevenue?: string | number | null;
          }>
        }
        key={toolKey}
        title={
          type === "tool-getTopCustomers"
            ? "Top Customers"
            : type === "tool-getCustomerLTV"
              ? "Customer LTV"
              : type === "tool-getChurnRiskCustomers"
                ? "Churn Risk Customers"
                : "Customer Search Results"
        }
      />
    );
  }

  if (
    type === "tool-getCustomerLTV" &&
    state === "output-available" &&
    output &&
    typeof output === "object" &&
    !Array.isArray(output) &&
    !("error" in output)
  ) {
    return (
      <CustomerResultsCard
        customers={[
          output as {
            avgOrderValue?: string | number | null;
            email: string;
            ltv?: string | number | null;
            name: string;
            orderCount?: number | null;
            segment?: string | null;
            totalRevenue?: string | number | null;
          },
        ]}
        key={toolKey}
        title="Customer LTV"
      />
    );
  }

  return state === "output-available" ? (
    <Tool className={wideWidthClass} defaultOpen={true} key={toolKey}>
      <ToolHeader state={state as never} type={type as never} />
      <ToolContent>
        <ToolOutput errorText={undefined} output={output} />
      </ToolContent>
    </Tool>
  ) : (
    <ToolActivityCard
      detail={summarizeToolInput("input" in part ? part.input : undefined)}
      key={toolKey}
      state={state as never}
      title={
        type === "tool-getCustomerLTV"
          ? "Customer LTV"
          : type === "tool-getTopCustomers"
            ? "Top Customer Analysis"
            : type === "tool-getChurnRiskCustomers"
              ? "Churn Risk Scan"
              : "Customer Search"
      }
    />
  );
};

const renderAnalyticsTool: ToolRenderer = ({ messageId, part, partIndex }) => {
  const toolKey = getToolKey(part, messageId, partIndex);
  const state = getToolState(part);
  const output = "output" in part ? part.output : undefined;

  if (
    state === "output-available" &&
    output &&
    typeof output === "object" &&
    "kpis" in output &&
    "recentOrders" in output
  ) {
    return (
      <AnalyticsSummaryCard
        key={toolKey}
        summary={
          output as {
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
    <Tool className={wideWidthClass} defaultOpen={true} key={toolKey}>
      <ToolHeader state={state as never} type="tool-getAnalyticsSummary" />
      <ToolContent>
        <ToolOutput errorText={undefined} output={output} />
      </ToolContent>
    </Tool>
  ) : (
    <ToolActivityCard
      detail={summarizeToolInput("input" in part ? part.input : undefined)}
      key={toolKey}
      state={state as never}
      title="Analytics Summary"
    />
  );
};

const renderKnowledgeTool: ToolRenderer = ({ messageId, part, partIndex }) => {
  const toolKey = getToolKey(part, messageId, partIndex);
  const state = getToolState(part);
  const output = "output" in part ? part.output : undefined;

  if (state === "output-available" && Array.isArray(output)) {
    return (
      <KnowledgeResultsCard
        key={toolKey}
        results={
          output as Array<{
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
    <Tool className={wideWidthClass} defaultOpen={true} key={toolKey}>
      <ToolHeader state={state as never} type="tool-retrieveKnowledgeContext" />
      <ToolContent>
        <ToolOutput errorText={undefined} output={output} />
      </ToolContent>
    </Tool>
  ) : (
    <ToolActivityCard
      detail={summarizeToolInput("input" in part ? part.input : undefined)}
      key={toolKey}
      state={state as never}
      title="Knowledge Lookup"
    />
  );
};

const renderMemoryTool: ToolRenderer = ({ messageId, part, partIndex }) => {
  const toolKey = getToolKey(part, messageId, partIndex);
  const state = getToolState(part);
  const type = part.type;
  const output = "output" in part ? part.output : undefined;

  if (state === "output-available" && output && typeof output === "object") {
    const record = output as Record<string, unknown>;

    return (
      <MemoryCard
        key={toolKey}
        title={
          type === "tool-storeUserPreference"
            ? "Preference Saved"
            : "Stored Context"
        }
        values={[
          { label: "Tone", value: record.preferredTone as string | undefined },
          {
            label: "Business",
            value: record.businessType as string | undefined,
          },
          {
            label: "Context",
            value: record.customContext as string | undefined,
          },
        ]}
      />
    );
  }

  return state === "output-available" ? (
    <Tool className={wideWidthClass} defaultOpen={true} key={toolKey}>
      <ToolHeader state={state as never} type={type as never} />
      <ToolContent>
        <ToolOutput errorText={undefined} output={output} />
      </ToolContent>
    </Tool>
  ) : (
    <ToolActivityCard
      detail={summarizeToolInput("input" in part ? part.input : undefined)}
      key={toolKey}
      state={state as never}
      title={
        type === "tool-storeUserPreference"
          ? "Saving Preference"
          : "Recalling Context"
      }
    />
  );
};

const exactToolRenderers: Record<string, ToolRenderer> = {
  "tool-createCampaign": renderCreateCampaignTool,
  "tool-createDocument": renderCreateDocumentTool,
  "tool-getAnalyticsSummary": renderAnalyticsTool,
  "tool-getWeather": renderWeatherTool,
  "tool-recallUserContext": renderMemoryTool,
  "tool-requestSuggestions": renderSuggestionsTool,
  "tool-retrieveKnowledgeContext": renderKnowledgeTool,
  "tool-sendCampaign": renderSendCampaignTool,
  "tool-storeUserPreference": renderMemoryTool,
  "tool-updateDocument": renderUpdateDocumentTool,
};

const matcherToolRenderers: Array<{
  matches: (type: string) => boolean;
  render: ToolRenderer;
}> = [
  {
    matches: (type) => customerToolTypes.has(type),
    render: renderCustomerTool,
  },
];

export function renderMessageToolPart(params: RenderToolPartParams) {
  const { part } = params;

  if (!part.type.startsWith("tool-")) {
    return null;
  }

  const exactRenderer = exactToolRenderers[part.type];

  if (exactRenderer) {
    return exactRenderer(params);
  }

  const matchedRenderer = matcherToolRenderers.find(({ matches }) =>
    matches(part.type)
  );

  if (matchedRenderer) {
    return matchedRenderer.render(params);
  }

  return renderGenericTool(params);
}
