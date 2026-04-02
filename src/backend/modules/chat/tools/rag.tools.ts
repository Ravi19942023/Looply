import { tool } from "ai";
import { z } from "zod";

import { DEFAULT_RAG_LIMIT, type RagService } from "@/backend/modules/rag";

export function buildRagTools(ragService: RagService, actorId: string, chatId?: string) {
  return {
    retrieveKnowledgeContext: tool({
      description:
        "Search both the global knowledge-base and documents uploaded specifically for this chat session (PDFs, DOCX, TXT, MD) for relevant context. Returns matching text chunks with relevance scores and source filenames. Use this when the user asks about content from global documents or session-specific files. Always cite the source filename in your response.",
      inputSchema: z.object({
        query: z.string().min(1).describe("The search query to find relevant document chunks"),
        limit: z.number().int().min(1).max(10).default(DEFAULT_RAG_LIMIT).describe("Maximum number of chunks to return"),
      }),
      execute: async ({ query, limit }) => {
        const chunks = await ragService.retrieveContextForQuery(actorId, query, { limit, chatId });

        return chunks.map((chunk) => ({
          text: chunk.text,
          fileName: chunk.fileName,
          score: chunk.score,
        }));
      },
    }),
  };
}
