import { env } from "@/backend/config";

export const INGESTION_CONFIG = {
  CHUNK_SIZE: 512,
  CHUNK_OVERLAP: 64,
  EMBEDDING_MODEL: env.AI_EMBEDDING_MODEL,
  EMBEDDING_DIMENSIONS: 1536,
} as const;
