import { tool } from "ai";
import { z } from "zod";
import type { UIMessageStreamWriter } from "ai";
import type { ChatMessage, ArtifactKind } from "@/lib/types";

import { createDocumentHandler, updateDocumentHandler, editDocumentHandler, requestSuggestionsHandler } from "./artifact.handlers";

interface BuildArtifactToolsConfig {
  actorId: string;
  chatId: string;
  dataStream: UIMessageStreamWriter<ChatMessage>;
  modelId?: string;
}

export function buildArtifactTools(config: BuildArtifactToolsConfig) {
  const modelId = config.modelId || "";

  return {
    createDocument: tool({
      description:
        "Generates a new artifact (text, code, or spreadsheet). If the request is based on retrieved data (like customers), YOU MUST pass it in 'context' for full population in one go. Avoid creating empty artifacts only to edit them later if data is already known.",
      inputSchema: z.object({
        title: z.string().describe("The concise title of the document"),
        kind: z.enum(["text", "code", "sheet"]).describe("The type of artifact to create"),
        context: z.string().optional().describe("Detailed instructions or the literal content to use for generation (e.g. data retrieved from other tools)."),
      }),
      execute: async ({ title, kind, context: toolContext }) => {
        return createDocumentHandler({ title, kind, context: toolContext }, { ...config, modelId });
      },
    }),
    updateDocument: tool({
      description:
        "Rewrite or update an existing artifact document with new instructions. Do not use for simple formatting changes to diagrams in chat.",
      inputSchema: z.object({
        id: z.string().describe("The exact ID of the existing document to update"),
        description: z.string().describe("A specific description of the changes to apply"),
      }),
      execute: async ({ id, description }) => {
        return updateDocumentHandler({ id, description }, { ...config, modelId });
      },
    }),
    editDocument: tool({
      description:
        "Make a targeted edit to an existing artifact by finding and replacing an exact string. Preferred for small changes. The old_string must match exactly.",
      inputSchema: z.object({
        id: z.string().describe("The ID of the artifact to edit"),
        old_string: z.string().describe("Exact string to find. Include surrounding lines for uniqueness."),
        new_string: z.string().describe("Replacement string"),
      }),
      execute: async ({ id, old_string, new_string }) => {
        return editDocumentHandler({ id, old_string, new_string }, { ...config, modelId });
      },
    }),
    requestSuggestions: tool({
      description:
        "Request writing suggestions for an existing document artifact. Use when the user asks to improve or get suggestions for a document.",
      inputSchema: z.object({
        id: z.string().describe("The UUID of an existing document artifact"),
      }),
      execute: async ({ id }) => {
        return requestSuggestionsHandler({ id }, { ...config, modelId });
      },
    }),
  };
}
