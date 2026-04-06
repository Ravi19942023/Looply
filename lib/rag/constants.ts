export const RAG_ALLOWED_GLOBAL_UPLOAD_TYPES = [
  "application/pdf",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const RAG_ALLOWED_SESSION_UPLOAD_TYPES = [
  ...RAG_ALLOWED_GLOBAL_UPLOAD_TYPES,
  "text/markdown",
] as const;

export const MAX_GLOBAL_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024;
export const MAX_SESSION_UPLOAD_SIZE_BYTES = 1 * 1024 * 1024;
export const EMBEDDING_DIMENSIONS = 1536;
export const EMBEDDING_MODEL =
  process.env.RAG_EMBEDDING_MODEL ?? "openai/text-embedding-3-small";
export const DEFAULT_RAG_LIMIT = 5;
export const DEFAULT_RAG_MIN_SCORE = 0.35;
export const CHUNK_SIZE = 1400;
export const CHUNK_OVERLAP = 180;
