import type { ChatMessage, Attachment, Annotation, SendCampaignOutput, SendCampaignSuccess, ArtifactKind } from "@/lib/types";

export type { ChatMessage, Attachment, Annotation, SendCampaignOutput, SendCampaignSuccess, ArtifactKind };

export interface ChatSession {
  id: string;
  title: string;
}
