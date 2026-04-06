import { tool } from "ai";
import { z } from "zod";
import type { AuthSession } from "@/lib/auth/types";
import { retrieveKnowledgeContext } from "@/lib/rag/service";

export const retrieveKnowledgeContextTool = ({
  chatId,
  session,
}: {
  chatId: string;
  session: AuthSession;
}) =>
  tool({
    description:
      "Search uploaded knowledge-base documents and chat-session files for relevant context. Session files should be prioritized over global docs when both match.",
    inputSchema: z.object({
      query: z.string().min(2),
      limit: z.number().int().min(1).max(10).optional(),
    }),
    execute: async ({ query, limit }) =>
      retrieveKnowledgeContext({
        actorId: session.user.id,
        chatId,
        limit,
        query,
      }),
  });
