import { streamText, type UIMessageStreamWriter } from "ai";
import { getLanguageModel } from "@/lib/ai/providers";
import type { ChatMessage, ArtifactKind } from "@/lib/types";
import { ARTIFACT_CONFIGS, STREAM_EVENTS } from "./artifact.constants";

/**
 * Streams AI-generated content to the client while accumulating the full response.
 */
export async function streamArtifactContent({
  kind,
  systemPrompt,
  userPrompt,
  modelId,
  dataStream,
}: {
  kind: ArtifactKind;
  systemPrompt: string;
  userPrompt: string;
  modelId: string;
  dataStream: UIMessageStreamWriter<ChatMessage>;
}) {
  let fullContent = "";
  const { deltaType } = ARTIFACT_CONFIGS[kind];

  const { fullStream } = streamText({
    model: getLanguageModel(modelId),
    system: systemPrompt,
    prompt: userPrompt,
  });

  for await (const delta of fullStream) {
    if (delta.type === "text-delta") {
      fullContent += delta.text;
      
      dataStream.write({
        type: deltaType as any,
        data: fullContent,
        transient: true,
      });
    }
  }

  return fullContent.trim();
}

/**
 * Initializes the artifact stream with metadata.
 */
export function initializeArtifactStream(
  dataStream: UIMessageStreamWriter<ChatMessage>,
  metadata: { id: string; title: string; kind: ArtifactKind }
) {
  dataStream.write({ type: STREAM_EVENTS.KIND, data: metadata.kind, transient: true });
  dataStream.write({ type: STREAM_EVENTS.ID, data: metadata.id, transient: true });
  dataStream.write({ type: STREAM_EVENTS.TITLE, data: metadata.title, transient: true });
  dataStream.write({ type: STREAM_EVENTS.CLEAR, data: null, transient: true });
}
