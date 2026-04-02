export interface PromptContext {
  ragContext: string | null;
  userMemory: UserMemorySnapshot | null;
  conversationSummary: string | null;
  availableTools: ToolDescription[];
  currentDate: string;
  sessionId: string;
  sessionFiles?: { fileName: string; id: string }[];
}

export interface UserMemorySnapshot {
  preferredTone: string | null;
  businessType: string | null;
  typicalCampaigns: string[];
  customContext: string | null;
}

export interface ToolDescription {
  name: string;
  purpose: string;
  whenToUse: string;
  displayName?: string;
}
