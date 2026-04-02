"use client";

import type { UIMessage } from "ai";
import { CheckCircle } from "lucide-react";
import { CampaignApprovalCard } from "./CampaignApprovalCard";
import { DocumentPreview } from "./DocumentPreview";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { ToolCallNotification } from "./ToolCallNotification";
import { isSendCampaignOutput, isSendCampaignSuccess } from "../../utils/chat.utils";
import type { Annotation, ArtifactKind } from "@/lib/types";

type Part = UIMessage["parts"][number];

type ToolLikePart = Part & {
  args?: unknown;
  input?: unknown;
  output?: unknown;
  result?: unknown;
  state?: string;
  toolCallId?: string;
  toolName?: string;
};

type DynamicToolPart = Part & {
  input?: unknown;
  output?: unknown;
  state?: string;
  toolName?: string;
};

function getToolPartPayload(part: Part) {
  const payload = part as ToolLikePart;

  return {
    input: payload.args ?? payload.input,
    output: payload.result ?? payload.output,
    state: payload.state ?? "input-streaming",
    toolName: payload.toolName ?? part.type.replace("tool-", ""),
  };
}

export function MessagePart({
  annotations,
  index,
  isAssistant,
  isLastPart,
  isLoading,
  onOpenArtifact,
  part,
}: {
  annotations?: Annotation[];
  index: number;
  isAssistant: boolean;
  isLastPart: boolean;
  isLoading: boolean;
  onOpenArtifact?: (id: string, title: string, kind: ArtifactKind, content: string) => void;
  part: Part;
}) {
  if (part.type === "text") {
    return (
      <div key={`text-${index}`} className="space-y-3">
        {isAssistant ? (
          <MarkdownRenderer content={part.text} />
        ) : (
          <div className="whitespace-pre-wrap break-words text-sm leading-6 text-background">
            {part.text}
          </div>
        )}
        {isLastPart && isLoading ? (
          <span className="inline-block size-2 animate-pulse rounded-full bg-foreground/60" />
        ) : null}
      </div>
    );
  }

  if (part.type.startsWith("tool-")) {
    const { input, output, state, toolName } = getToolPartPayload(part);

    if (toolName === "sendCampaign") {
      if (state === "result" && isSendCampaignOutput(output)) {
        const { campaign } = output;
        return (
          <CampaignApprovalCard
            key={`sendCampaign-approval-${index}`}
            campaignId={campaign.id}
            name={campaign.name}
            recipientCount={campaign.recipientCount}
            recipients={campaign.recipients}
            segment={campaign.segment}
            status={campaign.status}
            subject={campaign.subject}
          />
        );
      }

      if (state === "result" && isSendCampaignSuccess(output)) {
        const { campaign } = output;
        return (
          <div
            key={`sendCampaign-success-${index}`}
            className="my-2 flex items-center gap-3 rounded-[24px] border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-600"
          >
            <CheckCircle className="size-5" aria-hidden="true" />
            <div>
              <p className="text-sm font-bold tracking-tight">
                Campaign &quot;{campaign.name}&quot; dispatched successfully.
              </p>
              <p className="mt-0.5 text-[10px] font-black uppercase tracking-[0.2em] opacity-70">
                Live engagement tracking initiated
              </p>
            </div>
          </div>
        );
      }
    }

    if (toolName === "createDocument" || toolName === "updateDocument") {
      const args = (input ?? {}) as Record<string, unknown>;
      const result = (output ?? {}) as Record<string, unknown>;
      const id = String(result.id ?? args.id ?? "streaming-artifact");
      const title = String(result.title ?? args.title ?? "Untitled Artifact");
      const kind = (result.kind ?? args.kind ?? "text") as ArtifactKind;
      const content = String(result.content ?? "");

      return (
        <DocumentPreview
          content={content}
          id={id}
          key={`${toolName}-${index}`}
          kind={kind}
          onOpen={() => onOpenArtifact?.(id, title, kind, content)}
          status={state === "result" || state === "output-available" ? "idle" : "streaming"}
          title={title}
        />
      );
    }

    const toolPart = part as ToolLikePart;
    const metadata = annotations?.find(
      (annotation) =>
        annotation.type === "tool-metadata" &&
        (annotation.toolCallId === toolPart.toolCallId || annotation.toolName === toolName),
    ) as { displayName?: string } | undefined;

    const errorText =
      output && typeof output === "object" && "error" in (output as Record<string, unknown>)
        ? String((output as Record<string, unknown>).error)
        : undefined;

    return (
      <ToolCallNotification
        displayName={metadata?.displayName as string | undefined}
        errorText={errorText}
        input={input}
        key={`${part.type}-${index}`}
        label={toolName}
        output={output}
        state={state}
      />
    );
  }

  if (part.type === "dynamic-tool") {
    const dynamicToolPart = part as DynamicToolPart;
    const toolName = String(dynamicToolPart.toolName ?? "tool");
    const metadata = annotations?.find(
      (annotation) =>
        annotation.type === "tool-metadata" && annotation.toolName === toolName,
    ) as { displayName?: string } | undefined;

    return (
      <ToolCallNotification
        displayName={metadata?.displayName as string | undefined}
        input={dynamicToolPart.input}
        key={`dynamic-tool-${index}`}
        label={toolName}
        output={dynamicToolPart.output}
        state={String(dynamicToolPart.state ?? "input-streaming")}
      />
    );
  }

  return null;
}
