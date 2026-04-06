CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "KnowledgeDocument"
ADD COLUMN IF NOT EXISTS "source" varchar(20) NOT NULL DEFAULT 'curated',
ADD COLUMN IF NOT EXISTS "key" text,
ADD COLUMN IF NOT EXISTS "url" text,
ADD COLUMN IF NOT EXISTS "fileName" varchar(500),
ADD COLUMN IF NOT EXISTS "fileSize" integer,
ADD COLUMN IF NOT EXISTS "contentType" varchar(255),
ADD COLUMN IF NOT EXISTS "chunkCount" integer,
ADD COLUMN IF NOT EXISTS "inContext" boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS "ChatDocument" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "chatId" uuid NOT NULL REFERENCES "Chat"("id"),
  "userId" uuid NOT NULL REFERENCES "User"("id"),
  "key" text NOT NULL,
  "url" text NOT NULL,
  "fileName" varchar(500) NOT NULL,
  "fileSize" integer NOT NULL,
  "contentType" varchar(255) NOT NULL,
  "content" text NOT NULL,
  "chunkCount" integer NOT NULL,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "DocumentEmbedding" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "namespace" text NOT NULL DEFAULT 'global',
  "recordId" text NOT NULL,
  "scope" varchar(20) NOT NULL DEFAULT 'global',
  "actorId" uuid NOT NULL REFERENCES "User"("id"),
  "chatId" uuid REFERENCES "Chat"("id"),
  "knowledgeDocumentId" uuid REFERENCES "KnowledgeDocument"("id"),
  "chatDocumentId" uuid REFERENCES "ChatDocument"("id"),
  "fileName" varchar(500) NOT NULL,
  "text" text NOT NULL,
  "chunkIndex" integer NOT NULL,
  "embedding" vector(1536) NOT NULL,
  "metadata" json NOT NULL DEFAULT '{}'::json,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "document_embeddings_namespace_record_idx"
ON "DocumentEmbedding" ("namespace", "recordId");

CREATE TABLE IF NOT EXISTS "RagTelemetryLog" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "actorId" uuid REFERENCES "User"("id"),
  "chatId" uuid REFERENCES "Chat"("id"),
  "source" text NOT NULL,
  "model" text,
  "promptTokens" integer NOT NULL DEFAULT 0,
  "completionTokens" integer NOT NULL DEFAULT 0,
  "totalTokens" integer NOT NULL DEFAULT 0,
  "metadata" json NOT NULL DEFAULT '{}'::json,
  "createdAt" timestamp NOT NULL DEFAULT now()
);
