export interface MemoryRecord {
  userId: string;
  preferredTone: string | null;
  businessType: string | null;
  typicalCampaigns: string[];
  reportingPrefs: Record<string, unknown>;
  customContext: string | null;
  updatedAt: Date;
}

export interface ConversationRecord {
  id: string;
  sessionId: string;
  role: string;
  content: string;
  parts: unknown[];
  attachments: Array<{ name: string; url: string; contentType: string }>;
  createdAt: Date;
}

export interface AppendMessageInput {
  sessionId: string;
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  parts?: unknown[];
  attachments?: Array<{ name: string; url: string; contentType: string }>;
}
