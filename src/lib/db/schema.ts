import type {
  ChatArtifactRecord,
  ChatArtifactVersionRecord,
  ChatMessageRecord,
  ChatRecord,
} from "@/backend/db/schema";

export type Chat = ChatRecord;
export type DBMessage = ChatMessageRecord;
export type Vote = {
  chatId: string;
  messageId: string;
  isUpvoted: boolean;
};

export type Document = {
  id: string;
  createdAt: Date;
  title: string;
  content: string | null;
  kind: string;
  userId: string;
};

export type Suggestion = {
  id: string;
  documentId: string;
  documentCreatedAt: Date;
  originalText: string;
  suggestedText: string;
  description: string | null;
  isResolved: boolean;
  userId: string;
  createdAt: Date;
};

export type ArtifactRecord = ChatArtifactRecord;
export type ArtifactVersionRecord = ChatArtifactVersionRecord;
