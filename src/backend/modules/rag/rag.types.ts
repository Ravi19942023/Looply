export interface RagContextChunk {
  id: string;
  score: number;
  text?: string;
  fileName?: string;
  url?: string;
  scope?: "global" | "session";
  metadata?: Record<string, unknown>;
}

export interface RagRetrievalOptions {
  limit?: number;
  minScore?: number;
  chatId?: string;
}
