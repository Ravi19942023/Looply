import { gateway } from "ai";

/**
 * Standard model resolver for Looply.
 * Routes all requests through the Vercel AI Gateway to ensure correct billing and telemetry.
 */
export function getLanguageModel(modelId: string) {
  return gateway.languageModel(modelId);
}

export function getEmbeddingModel(modelId: string) {
  return gateway.embeddingModel(modelId);
}
