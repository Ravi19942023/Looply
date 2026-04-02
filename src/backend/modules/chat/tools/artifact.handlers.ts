import { Output, streamText, type UIMessageStreamWriter } from "ai";
import { z } from "zod";
import { getDocumentById, saveDocument, saveSuggestions } from "@/lib/db/queries";
import type { Suggestion } from "@/lib/db/schema";
import type { ChatMessage, ArtifactKind } from "@/lib/types";
import { getLanguageModel } from "@/lib/ai/providers";
import { updateDocumentPromptTemplate } from "@/backend/lib/prompts/artifact.prompt";
import { ARTIFACT_CONFIGS, STREAM_EVENTS } from "./artifact.constants";
import { initializeArtifactStream, streamArtifactContent } from "./artifact.utils";

interface ToolHandlerContext {
  actorId: string;
  chatId: string;
  dataStream: UIMessageStreamWriter<ChatMessage>;
  modelId: string;
}

/**
 * Handles the creation of a new artifact document.
 */
export async function createDocumentHandler(
  { title, kind, context: initialContext }: { title: string; kind: ArtifactKind; context?: string },
  context: ToolHandlerContext
) {
  const { actorId, chatId, dataStream, modelId } = context;
  const id = crypto.randomUUID();

  initializeArtifactStream(dataStream, { id, title, kind });

  await saveDocument({
    id,
    chatId,
    title,
    kind,
    content: "",
    userId: actorId,
  });

  const content = await streamArtifactContent({
    kind,
    systemPrompt: ARTIFACT_CONFIGS[kind].createPrompt,
    userPrompt: initialContext || title,
    modelId,
    dataStream,
  });

  await saveDocument({
    id,
    chatId,
    title,
    kind,
    content,
    userId: actorId,
  });

  dataStream.write({ type: STREAM_EVENTS.FINISH, data: null, transient: true });

  return { id, title, kind, content };
}

/**
 * Handles rewriting an existing artifact document.
 */
export async function updateDocumentHandler(
  { id, description }: { id: string; description: string },
  context: ToolHandlerContext
) {
  const { actorId, chatId, dataStream, modelId } = context;
  const document = await getDocumentById({ id });

  if (!document) {
    throw new Error("Document not found");
  }

  if (document.userId !== actorId) {
    throw new Error("Unauthorized to update this document");
  }

  const kind = (document.kind as ArtifactKind) || "text";

  initializeArtifactStream(dataStream, { id, title: document.title, kind });

  const content = await streamArtifactContent({
    kind,
    systemPrompt: updateDocumentPromptTemplate(document.content, kind),
    userPrompt: description,
    modelId,
    dataStream,
  });

  await saveDocument({
    id,
    chatId,
    title: document.title,
    kind,
    content,
    userId: actorId,
  });

  dataStream.write({ type: STREAM_EVENTS.FINISH, data: null, transient: true });

  return {
    id,
    title: document.title,
    kind,
    content,
  };
}

/**
 * Handles targeted edits to an existing artifact document.
 */
export async function editDocumentHandler(
  { id, old_string, new_string, replace_all }: { 
    id: string; 
    old_string: string; 
    new_string: string; 
    replace_all?: boolean 
  },
  context: ToolHandlerContext
) {
  const { actorId, chatId, dataStream } = context;
  const document = await getDocumentById({ id });

  if (!document) {
    throw new Error("Document not found");
  }

  if (document.userId !== actorId) {
    throw new Error("Unauthorized to edit this document");
  }

  if (!document.content) {
    throw new Error("Document has no content");
  }

  if (!document.content.includes(old_string)) {
    throw new Error("old_string not found in document. Ensure highlighting exactly what you want to replace.");
  }

  const updated = replace_all
    ? document.content.replaceAll(old_string, new_string)
    : document.content.replace(old_string, new_string);

  await saveDocument({
    id: document.id,
    chatId,
    title: document.title,
    kind: document.kind as ArtifactKind,
    content: updated,
    userId: actorId,
  });

  const kind = (document.kind as ArtifactKind) || "text";

  // Data updates for UI streaming sync
  dataStream.write({ type: STREAM_EVENTS.CLEAR, data: null, transient: true });

  const deltaEvent = kind === "code" 
    ? STREAM_EVENTS.CODE_DELTA 
    : kind === "sheet" 
      ? STREAM_EVENTS.SHEET_DELTA 
      : kind === "diagram"
        ? STREAM_EVENTS.DIAGRAM_DELTA
        : STREAM_EVENTS.TEXT_DELTA;

  dataStream.write({
    type: deltaEvent,
    data: updated,
    transient: true,
  });

  dataStream.write({ type: STREAM_EVENTS.FINISH, data: null, transient: true });

  return {
    id,
    title: document.title,
    kind,
    content: kind === "code" 
      ? "The script has been edited successfully." 
      : "The document has been edited successfully.",
  };
}
export async function requestSuggestionsHandler(
  { id: documentId }: { id: string },
  context: ToolHandlerContext
) {
  const { actorId, dataStream, modelId } = context;
  const document = await getDocumentById({ id: documentId });

  if (!document || !document.content) {
    throw new Error("Document not found");
  }

  if (document.userId !== actorId) {
    throw new Error("Unauthorized to access this document");
  }

  const suggestions: Omit<
    Suggestion,
    "userId" | "createdAt" | "documentCreatedAt"
  >[] = [];

  const { partialOutputStream } = streamText({
    model: getLanguageModel(modelId),
    system:
      "You are a writing assistant. Given a piece of writing, offer up to 5 suggestions to improve it. Each suggestion must contain full sentences, not just individual words. Describe what changed and why.",
    prompt: document.content,
    output: Output.array({
      element: z.object({
        originalSentence: z.string().describe("The original sentence"),
        suggestedSentence: z.string().describe("The suggested sentence"),
        description: z.string().describe("The description of the suggestion"),
      }),
    }),
  });

  let processedCount = 0;
  for await (const partialOutput of partialOutputStream) {
    if (!partialOutput) {
      continue;
    }

    for (let i = processedCount; i < partialOutput.length; i++) {
      const element = partialOutput[i];
      if (
        !element?.originalSentence ||
        !element?.suggestedSentence ||
        !element?.description
      ) {
        continue;
      }

      const suggestion = {
        originalText: element.originalSentence,
        suggestedText: element.suggestedSentence,
        description: element.description,
        id: crypto.randomUUID(),
        documentId,
        isResolved: false,
      };

      dataStream.write({
        type: STREAM_EVENTS.SUGGESTION,
        data: suggestion as Suggestion,
        transient: true,
      });

      suggestions.push(suggestion);
      processedCount++;
    }
  }

  await saveSuggestions({
    suggestions: suggestions.map((suggestion) => ({
      ...suggestion,
      userId: actorId,
      isResolved: false,
      documentCreatedAt: document.createdAt,
    })),
  });

  return {
    id: documentId,
    title: document.title,
    kind: document.kind as ArtifactKind,
    message: "Suggestions have been added to the document",
  };
}
