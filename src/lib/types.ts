import type { UIMessage } from "ai";
import { z } from "zod";

export const messageMetadataSchema = z.object({
  createdAt: z.string(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

export type ArtifactKind = "text" | "code" | "sheet" | "diagram";

export type CustomUIDataTypes = {
  textDelta: string;
  codeDelta: string;
  sheetDelta: string;
  appendMessage: string;
  suggestion: {
    id: string;
    originalText: string;
    suggestedText: string;
    description?: string | null;
  };
  id: string;
  title: string;
  kind: ArtifactKind;
  diagramDelta: string;
  clear: null;
  finish: null;
  "chat-title": string;
};

export interface Attachment {
  name: string;
  url: string;
  contentType: string;
}

export interface TokenUsageAnnotation {
  type: "token-usage";
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ToolMetadataAnnotation {
  type: "tool-metadata";
  toolCallId?: string;
  toolName: string;
  displayName: string;
}

export type Annotation = TokenUsageAnnotation | ToolMetadataAnnotation | { type: string; [key: string]: unknown };

export interface SendCampaignOutput {
  requiresApproval: true;
  campaign: {
    id: string;
    name: string;
    subject: string;
    segment: string;
    recipientCount: number | null;
    recipients?: { name: string; email: string }[] | null;
    status: string;
  };
}

export interface SendCampaignSuccess {
  success: true;
  campaign: {
    id: string;
    name: string;
    subject: string;
    segment: string;
    recipientCount: number | null;
    recipients?: { name: string; email: string }[] | null;
    status: string;
  };
}

export type ChatMessage = UIMessage<MessageMetadata, CustomUIDataTypes> & {
  attachments?: Attachment[];
  annotations?: Annotation[];
};
