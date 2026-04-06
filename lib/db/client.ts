import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  auditLog,
  campaign,
  campaignLog,
  chat,
  chatDocument,
  customer,
  customerMetric,
  document,
  documentEmbedding,
  emailLog,
  jobRun,
  knowledgeDocument,
  message,
  product,
  ragTelemetryLog,
  stream,
  suggestion,
  transaction,
  user,
  userMemory,
  vote,
} from "./schema";

const schema = {
  auditLog,
  campaign,
  campaignLog,
  chat,
  chatDocument,
  customer,
  customerMetric,
  document,
  documentEmbedding,
  emailLog,
  jobRun,
  knowledgeDocument,
  message,
  product,
  ragTelemetryLog,
  stream,
  suggestion,
  transaction,
  user,
  userMemory,
  vote,
};

declare global {
  // eslint-disable-next-line no-var
  var __looplyRawClient: ReturnType<typeof postgres> | undefined;
  // eslint-disable-next-line no-var
  var __looplyDb: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error("POSTGRES_URL is not configured.");
}

export const rawClient =
  globalThis.__looplyRawClient ??
  postgres(connectionString, {
    max: process.env.NODE_ENV === "production" ? 10 : 1,
    prepare: false,
  });

export const db =
  globalThis.__looplyDb ??
  drizzle(rawClient, {
    schema,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__looplyRawClient = rawClient;
  globalThis.__looplyDb = db;
}
