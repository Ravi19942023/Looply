import { embed, embedMany } from "ai";
import { INGESTION_CONFIG } from "@/backend/modules/rag";
import { getEmbeddingModel } from "@/lib/ai/providers";

export async function embedText(value: string) {
  const result = await embed({
    model: getEmbeddingModel(INGESTION_CONFIG.EMBEDDING_MODEL),
    value,
  });

  return { embedding: result.embedding, usage: result.usage };
}

export async function embedTexts(values: string[]) {
  if (values.length === 0) {
    return { embeddings: [], usage: { tokens: 0 } };
  }

  const result = await embedMany({
    model: getEmbeddingModel(INGESTION_CONFIG.EMBEDDING_MODEL),
    values,
  });

  return { embeddings: result.embeddings, usage: result.usage };
}
