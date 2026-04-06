import { del, put } from "@vercel/blob";
import { and, count, desc, eq, gte, ilike, or, sql as drizzleSql } from "drizzle-orm";
import { createAuditLog, getChatById, saveChat } from "@/lib/db/queries";
import { db, rawClient as client } from "@/lib/db/client";
import {
  chatDocument,
  documentEmbedding,
  knowledgeDocument,
  ragTelemetryLog,
  user,
} from "@/lib/db/schema";
import { buildPaginationMeta, type PaginationMeta } from "@/lib/pagination";
import { chunkText } from "./chunk";
import {
  DEFAULT_RAG_LIMIT,
  DEFAULT_RAG_MIN_SCORE,
  EMBEDDING_MODEL,
  MAX_GLOBAL_UPLOAD_SIZE_BYTES,
  MAX_SESSION_UPLOAD_SIZE_BYTES,
  RAG_ALLOWED_GLOBAL_UPLOAD_TYPES,
  RAG_ALLOWED_SESSION_UPLOAD_TYPES,
} from "./constants";
import { embedText, embedTexts } from "./embeddings";
import { extractText, isReadableExtractedText } from "./extract";
import { TextPreprocessor } from "./text-preprocessor";

type RagScope = "global" | "session";

type RagContextChunk = {
  fileName: string;
  id: string;
  scope: RagScope;
  score: number;
  text: string;
  title?: string;
  url?: string | null;
};

type RagTelemetryRow = {
  actorEmail: string | null;
  actorId: string | null;
  chatId: string | null;
  completionTokens: number;
  createdAt: Date;
  id: string;
  metadata: Record<string, unknown>;
  model: string | null;
  promptTokens: number;
  source: string;
  totalTokens: number;
};

const textPreprocessor = new TextPreprocessor();

function stripExtension(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "");
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function buildExcerpt(text: string, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedText = text.toLowerCase();
  const matchIndex = normalizedText.indexOf(normalizedQuery);

  if (matchIndex < 0) {
    return text.slice(0, 280).trim();
  }

  const start = Math.max(0, matchIndex - 110);
  const end = Math.min(text.length, matchIndex + normalizedQuery.length + 170);
  return text.slice(start, end).trim();
}

function vectorLiteral(values: number[]) {
  return `[${values.join(",")}]`;
}

function serializeMetadata(metadata: Record<string, unknown>) {
  return JSON.parse(JSON.stringify(metadata));
}

async function logRagTelemetry(input: {
  actorId?: string | null;
  chatId?: string | null;
  completionTokens?: number;
  metadata?: Record<string, unknown>;
  model?: string | null;
  promptTokens?: number;
  source: string;
  totalTokens: number;
}) {
  await db.insert(ragTelemetryLog).values({
    actorId: input.actorId ?? null,
    chatId: input.chatId ?? null,
    source: input.source,
    model: input.model ?? null,
    promptTokens: input.promptTokens ?? 0,
    completionTokens: input.completionTokens ?? 0,
    totalTokens: input.totalTokens,
    metadata: serializeMetadata(input.metadata ?? {}),
    createdAt: new Date(),
  });
}

async function createEmbeddings(params: {
  actorId: string;
  chatId?: string;
  fileName: string;
  knowledgeDocumentId?: string;
  namespace: string;
  scope: RagScope;
  sourceId: string;
  texts: string[];
}) {
  const { embeddings, usage } = await embedTexts(params.texts);

  if (usage?.tokens) {
    await logRagTelemetry({
      actorId: params.actorId,
      chatId: params.chatId ?? null,
      source: "rag:embedTexts",
      model: EMBEDDING_MODEL,
      promptTokens: usage.tokens,
      totalTokens: usage.tokens,
      metadata: {
        chunkCount: params.texts.length,
        fileName: params.fileName,
        scope: params.scope,
      },
    });
  }

  await db.insert(documentEmbedding).values(
    params.texts.map((text, index) => ({
      namespace: params.namespace,
      recordId: `${params.sourceId}:${index}`,
      scope: params.scope,
      actorId: params.actorId,
      chatId: params.chatId ?? null,
      knowledgeDocumentId: params.knowledgeDocumentId ?? null,
      chatDocumentId: params.scope === "session" ? params.sourceId : null,
      fileName: params.fileName,
      text,
      chunkIndex: index,
      embedding: embeddings[index] ?? [],
      metadata: {
        fileName: params.fileName,
        scope: params.scope,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }))
  );
}

export function listKnowledgeDocuments(actorId?: string) {
  const query = db
    .select()
    .from(knowledgeDocument)
    .orderBy(desc(knowledgeDocument.updatedAt));

  return actorId
    ? query.where(eq(knowledgeDocument.createdBy, actorId))
    : query;
}

export async function getPaginatedKnowledgeDocuments(params: {
  actorId?: string;
  page: number;
  pageSize: number;
  q?: string;
}): Promise<{
  items: Awaited<ReturnType<typeof listKnowledgeDocuments>>;
  pagination: PaginationMeta;
}> {
  const filters = [];
  const normalizedQuery = params.q?.trim();

  if (params.actorId) {
    filters.push(eq(knowledgeDocument.createdBy, params.actorId));
  }

  if (normalizedQuery) {
    const searchPattern = `%${normalizedQuery}%`;
    const searchFilter = or(
      ilike(knowledgeDocument.title, searchPattern),
      ilike(knowledgeDocument.content, searchPattern),
      ilike(knowledgeDocument.fileName, searchPattern)
    );

    if (searchFilter) {
      filters.push(searchFilter);
    }
  }

  const whereClause = filters.length > 0 ? and(...filters) : undefined;

  const [countResult] = await db
    .select({ count: count(knowledgeDocument.id) })
    .from(knowledgeDocument)
    .where(whereClause);

  const pagination = buildPaginationMeta({
    page: params.page,
    pageSize: params.pageSize,
    total: countResult?.count ?? 0,
  });

  const items = await db
    .select()
    .from(knowledgeDocument)
    .where(whereClause)
    .orderBy(desc(knowledgeDocument.updatedAt))
    .limit(pagination.pageSize)
    .offset((pagination.page - 1) * pagination.pageSize);

  return {
    items,
    pagination,
  };
}

export async function uploadKnowledgeDocument(params: {
  actorId: string;
  contentType: string;
  file: File;
}) {
  if (!RAG_ALLOWED_GLOBAL_UPLOAD_TYPES.includes(params.contentType as never)) {
    throw new Error(`Unsupported file type: ${params.contentType}`);
  }

  if (params.file.size > MAX_GLOBAL_UPLOAD_SIZE_BYTES) {
    throw new Error("File exceeds maximum upload size (25MB).");
  }

  const buffer = Buffer.from(await params.file.arrayBuffer());
  const extraction = await extractText(buffer, params.contentType);
  const cleanText = textPreprocessor.process(extraction.text);

  if (!isReadableExtractedText(cleanText)) {
    throw new Error("Extracted text is empty or unreadable.");
  }

  const safeName = sanitizeFileName(params.file.name);
  const blob = await put(
    `knowledge/${params.actorId}/${Date.now()}-${safeName}`,
    buffer,
    {
      access: "private",
      contentType: params.contentType,
      addRandomSuffix: false,
    }
  );

  try {
    const [createdDocument] = await db
      .insert(knowledgeDocument)
      .values({
        title: stripExtension(params.file.name),
        content: cleanText,
        source: "upload",
        key: blob.url,
        url: blob.downloadUrl,
        fileName: params.file.name,
        fileSize: params.file.size,
        contentType: params.contentType,
        chunkCount: 0,
        inContext: true,
        createdBy: params.actorId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const chunks = chunkText(cleanText);
    await createEmbeddings({
      actorId: params.actorId,
      fileName: params.file.name,
      knowledgeDocumentId: createdDocument.id,
      namespace: "global",
      scope: "global",
      sourceId: createdDocument.id,
      texts: chunks,
    });

    const [updatedDocument] = await db
      .update(knowledgeDocument)
      .set({
        chunkCount: chunks.length,
        updatedAt: new Date(),
      })
      .where(eq(knowledgeDocument.id, createdDocument.id))
      .returning();

    await createAuditLog({
      actorId: params.actorId,
      event: "knowledge.uploaded",
      resourceType: "knowledge",
      resourceId: createdDocument.id,
      metadata: {
        fileName: params.file.name,
        chunkCount: chunks.length,
      },
    });

    return updatedDocument ?? createdDocument;
  } catch (error) {
    await del(blob.url).catch(() => undefined);
    throw error;
  }
}

export async function deleteKnowledgeDocument(params: {
  actorId: string;
  id: string;
}) {
  const [document] = await db
    .select()
    .from(knowledgeDocument)
    .where(eq(knowledgeDocument.id, params.id))
    .limit(1);

  if (!document) {
    throw new Error("Document not found.");
  }

  if (document.createdBy !== params.actorId) {
    throw new Error("Unauthorized.");
  }

  if (document.key) {
    await del(document.key).catch(() => undefined);
  }

  await db
    .delete(documentEmbedding)
    .where(eq(documentEmbedding.knowledgeDocumentId, document.id));
  await db
    .delete(knowledgeDocument)
    .where(eq(knowledgeDocument.id, document.id));

  await createAuditLog({
    actorId: params.actorId,
    event: "knowledge.deleted",
    resourceType: "knowledge",
    resourceId: document.id,
    metadata: {
      fileName: document.fileName ?? document.title,
    },
  });
}

export async function toggleKnowledgeDocumentContext(params: {
  actorId: string;
  id: string;
  inContext: boolean;
}) {
  const [document] = await db
    .select()
    .from(knowledgeDocument)
    .where(eq(knowledgeDocument.id, params.id))
    .limit(1);

  if (!document) {
    throw new Error("Document not found.");
  }

  if (document.createdBy !== params.actorId) {
    throw new Error("Unauthorized.");
  }

  const [updated] = await db
    .update(knowledgeDocument)
    .set({ inContext: params.inContext, updatedAt: new Date() })
    .where(eq(knowledgeDocument.id, params.id))
    .returning();

  await createAuditLog({
    actorId: params.actorId,
    event: "knowledge.context.updated",
    resourceType: "knowledge",
    resourceId: params.id,
    metadata: {
      inContext: params.inContext,
    },
  });

  return updated;
}

export function listChatDocuments(params: { actorId: string; chatId: string }) {
  return db
    .select()
    .from(chatDocument)
    .where(
      and(
        eq(chatDocument.userId, params.actorId),
        eq(chatDocument.chatId, params.chatId)
      )
    )
    .orderBy(desc(chatDocument.createdAt));
}

export async function uploadChatDocument(params: {
  actorId: string;
  chatId: string;
  contentType: string;
  file: File;
}) {
  if (!RAG_ALLOWED_SESSION_UPLOAD_TYPES.includes(params.contentType as never)) {
    throw new Error(`Unsupported file type: ${params.contentType}`);
  }

  if (params.file.size > MAX_SESSION_UPLOAD_SIZE_BYTES) {
    throw new Error("File exceeds session upload size limit (1MB).");
  }

  const selectedChat = await getChatById({ id: params.chatId });

  if (!selectedChat) {
    await saveChat({
      id: params.chatId,
      userId: params.actorId,
      title: "New chat",
      visibility: "private",
    });
  } else if (selectedChat.userId !== params.actorId) {
    throw new Error("Chat not found.");
  }

  const buffer = Buffer.from(await params.file.arrayBuffer());
  const extraction = await extractText(buffer, params.contentType);
  const cleanText = textPreprocessor.process(extraction.text);

  if (!isReadableExtractedText(cleanText)) {
    throw new Error("Extracted text is empty or unreadable.");
  }

  const safeName = sanitizeFileName(params.file.name);
  const blob = await put(
    `chat-documents/${params.actorId}/${params.chatId}/${Date.now()}-${safeName}`,
    buffer,
    {
      access: "private",
      contentType: params.contentType,
      addRandomSuffix: false,
    }
  );

  try {
    const [createdDocument] = await db
      .insert(chatDocument)
      .values({
        chatId: params.chatId,
        userId: params.actorId,
        key: blob.url,
        url: blob.downloadUrl,
        fileName: params.file.name,
        fileSize: params.file.size,
        contentType: params.contentType,
        content: cleanText,
        chunkCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const chunks = chunkText(cleanText);
    await createEmbeddings({
      actorId: params.actorId,
      chatId: params.chatId,
      fileName: params.file.name,
      namespace: `chat:${params.chatId}`,
      scope: "session",
      sourceId: createdDocument.id,
      texts: chunks,
    });

    const [updatedDocument] = await db
      .update(chatDocument)
      .set({
        chunkCount: chunks.length,
        updatedAt: new Date(),
      })
      .where(eq(chatDocument.id, createdDocument.id))
      .returning();

    return updatedDocument ?? createdDocument;
  } catch (error) {
    await del(blob.url).catch(() => undefined);
    throw error;
  }
}

export async function deleteChatDocument(params: {
  actorId: string;
  id: string;
}) {
  const [document] = await db
    .select()
    .from(chatDocument)
    .where(eq(chatDocument.id, params.id))
    .limit(1);

  if (!document) {
    throw new Error("Document not found.");
  }

  if (document.userId !== params.actorId) {
    throw new Error("Unauthorized.");
  }

  await del(document.key).catch(() => undefined);
  await db
    .delete(documentEmbedding)
    .where(eq(documentEmbedding.chatDocumentId, document.id));
  await db.delete(chatDocument).where(eq(chatDocument.id, document.id));
}

type SemanticRow = {
  file_name: string;
  id: string;
  score: number;
  text: string;
  title: string | null;
  url: string | null;
};

async function semanticGlobalMatches(params: {
  actorId: string;
  queryEmbedding: number[];
  limit: number;
  minScore: number;
}) {
  const rows = await client<SemanticRow[]>`
    SELECT
      de."recordId" as id,
      de."fileName" as file_name,
      de."text" as text,
      kd."title" as title,
      kd."url" as url,
      (1 - (de."embedding" <=> ${vectorLiteral(params.queryEmbedding)}::vector)) as score
    FROM "DocumentEmbedding" de
    INNER JOIN "KnowledgeDocument" kd ON kd."id" = de."knowledgeDocumentId"
    WHERE de."namespace" = 'global'
      AND kd."inContext" = true
      AND kd."createdBy" = ${params.actorId}
    ORDER BY de."embedding" <=> ${vectorLiteral(params.queryEmbedding)}::vector
    LIMIT ${Math.max(params.limit * 4, 20)}
  `;

  return rows.filter((row: SemanticRow) => Number(row.score) >= params.minScore);
}

async function semanticSessionMatches(params: {
  actorId: string;
  chatId: string;
  queryEmbedding: number[];
  limit: number;
  minScore: number;
}) {
  const rows = await client<SemanticRow[]>`
    SELECT
      de."recordId" as id,
      de."fileName" as file_name,
      de."text" as text,
      cd."fileName" as title,
      cd."url" as url,
      (1 - (de."embedding" <=> ${vectorLiteral(params.queryEmbedding)}::vector)) as score
    FROM "DocumentEmbedding" de
    INNER JOIN "ChatDocument" cd ON cd."id" = de."chatDocumentId"
    WHERE de."namespace" = ${`chat:${params.chatId}`}
      AND cd."userId" = ${params.actorId}
    ORDER BY de."embedding" <=> ${vectorLiteral(params.queryEmbedding)}::vector
    LIMIT ${Math.max(params.limit * 4, 20)}
  `;

  return rows.filter((row: SemanticRow) => Number(row.score) >= params.minScore);
}

async function lexicalGlobalMatches(params: {
  actorId: string;
  limit: number;
  query: string;
}) {
  const [rows] = await Promise.all([
    db
      .select({
        id: knowledgeDocument.id,
        title: knowledgeDocument.title,
        fileName: knowledgeDocument.fileName,
        text: knowledgeDocument.content,
        url: knowledgeDocument.url,
      })
      .from(knowledgeDocument)
      .where(
        and(
          eq(knowledgeDocument.createdBy, params.actorId),
          eq(knowledgeDocument.inContext, true),
          drizzleSql`${knowledgeDocument.title} ilike ${`%${params.query}%`} or ${knowledgeDocument.content} ilike ${`%${params.query}%`}`
        )
      )
      .limit(params.limit),
  ]);

  return rows;
}

function lexicalSessionMatches(params: {
  actorId: string;
  chatId: string;
  limit: number;
  query: string;
}) {
  return db
    .select({
      id: chatDocument.id,
      title: chatDocument.fileName,
      fileName: chatDocument.fileName,
      text: chatDocument.content,
      url: chatDocument.url,
    })
    .from(chatDocument)
    .where(
      and(
        eq(chatDocument.userId, params.actorId),
        eq(chatDocument.chatId, params.chatId),
        drizzleSql`${chatDocument.fileName} ilike ${`%${params.query}%`} or ${chatDocument.content} ilike ${`%${params.query}%`}`
      )
    )
    .limit(params.limit);
}

export async function retrieveKnowledgeContext(params: {
  actorId: string;
  chatId?: string;
  limit?: number;
  query: string;
}) {
  const limit = params.limit ?? DEFAULT_RAG_LIMIT;
  const minScore = DEFAULT_RAG_MIN_SCORE;
  const { embedding, usage } = await embedText(params.query);

  if (usage?.tokens) {
    await logRagTelemetry({
      actorId: params.actorId,
      chatId: params.chatId ?? null,
      source: "rag:embed",
      model: EMBEDDING_MODEL,
      promptTokens: usage.tokens,
      totalTokens: usage.tokens,
      metadata: {
        query: params.query,
      },
    });
  }

  const [semanticGlobal, semanticSession, lexicalGlobal, lexicalSession] =
    await Promise.all([
      semanticGlobalMatches({
        actorId: params.actorId,
        queryEmbedding: embedding,
        limit,
        minScore,
      }),
      params.chatId
        ? semanticSessionMatches({
            actorId: params.actorId,
            chatId: params.chatId,
            queryEmbedding: embedding,
            limit,
            minScore,
          })
        : Promise.resolve([]),
      lexicalGlobalMatches({
        actorId: params.actorId,
        limit,
        query: params.query,
      }),
      params.chatId
        ? lexicalSessionMatches({
            actorId: params.actorId,
            chatId: params.chatId,
            limit,
            query: params.query,
          })
        : Promise.resolve([]),
    ]);

  const merged = new Map<string, RagContextChunk>();

  for (const row of semanticGlobal) {
    const item: RagContextChunk = {
      id: row.id,
      fileName: row.file_name,
      title: row.title ?? row.file_name,
      text: buildExcerpt(row.text, params.query),
      scope: "global",
      score: Number(row.score),
      url: row.url,
    };
    merged.set(`global:${row.id}`, item);
  }

  for (const row of semanticSession) {
    const item: RagContextChunk = {
      id: row.id,
      fileName: row.file_name,
      title: row.title ?? row.file_name,
      text: buildExcerpt(row.text, params.query),
      scope: "session",
      score: Number(row.score) + 0.08,
      url: row.url,
    };
    merged.set(`session:${row.id}`, item);
  }

  for (const row of lexicalGlobal) {
    const key = `global:${row.id}`;
    const existing = merged.get(key);
    const next: RagContextChunk = {
      id: row.id,
      fileName: row.fileName ?? row.title,
      title: row.title,
      text: buildExcerpt(row.text, params.query),
      scope: "global",
      score: existing ? Math.max(existing.score, 0.62) : 0.62,
      url: row.url,
    };
    merged.set(key, next);
  }

  for (const row of lexicalSession) {
    const key = `session:${row.id}`;
    const existing = merged.get(key);
    const next: RagContextChunk = {
      id: row.id,
      fileName: row.fileName,
      title: row.title,
      text: buildExcerpt(row.text, params.query),
      scope: "session",
      score: existing ? Math.max(existing.score, 0.75) : 0.75,
      url: row.url,
    };
    merged.set(key, next);
  }

  const results = [...merged.values()]
    .sort((left, right) => {
      if (left.scope !== right.scope) {
        return left.scope === "session" ? -1 : 1;
      }
      return right.score - left.score;
    })
    .slice(0, limit);

  await logRagTelemetry({
    actorId: params.actorId,
    chatId: params.chatId ?? null,
    source: params.chatId
      ? "rag:retrieve.hybrid.merged"
      : "rag:retrieve.hybrid",
    model: EMBEDDING_MODEL,
    totalTokens: 0,
    metadata: {
      query: params.query,
      matchedResults: results.length,
      sessionResults: results.filter((result) => result.scope === "session")
        .length,
      globalResults: results.filter((result) => result.scope === "global")
        .length,
    },
  });

  return results;
}

export async function getRagTelemetrySummary({ days = 30 }: { days?: number }) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const logs = await db
    .select()
    .from(ragTelemetryLog)
    .where(gte(ragTelemetryLog.createdAt, cutoff))
    .orderBy(desc(ragTelemetryLog.createdAt));

  return {
    days,
    totalTokens: logs.reduce((sum, entry) => sum + entry.totalTokens, 0),
    retrievalCount: logs.filter((entry) =>
      entry.source.startsWith("rag:retrieve")
    ).length,
    queryEmbedCount: logs.filter((entry) => entry.source === "rag:embed")
      .length,
    documentEmbedCount: logs.filter(
      (entry) => entry.source === "rag:embedTexts"
    ).length,
    rows: logs,
  };
}

export async function getRagTelemetryRows({ days = 30 }: { days?: number }) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const rows = await db
    .select({
      id: ragTelemetryLog.id,
      actorId: ragTelemetryLog.actorId,
      actorEmail: user.email,
      chatId: ragTelemetryLog.chatId,
      source: ragTelemetryLog.source,
      model: ragTelemetryLog.model,
      promptTokens: ragTelemetryLog.promptTokens,
      completionTokens: ragTelemetryLog.completionTokens,
      totalTokens: ragTelemetryLog.totalTokens,
      metadata: ragTelemetryLog.metadata,
      createdAt: ragTelemetryLog.createdAt,
    })
    .from(ragTelemetryLog)
    .leftJoin(user, eq(ragTelemetryLog.actorId, user.id))
    .where(gte(ragTelemetryLog.createdAt, cutoff))
    .orderBy(desc(ragTelemetryLog.createdAt));

  return rows as RagTelemetryRow[];
}

export async function getPaginatedRagTelemetryRows(params: {
  days?: number;
  page: number;
  pageSize: number;
}): Promise<{
  items: RagTelemetryRow[];
  pagination: PaginationMeta;
}> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (params.days ?? 30));

  const [countResult] = await db
    .select({ count: count(ragTelemetryLog.id) })
    .from(ragTelemetryLog)
    .where(gte(ragTelemetryLog.createdAt, cutoff));

  const pagination = buildPaginationMeta({
    page: params.page,
    pageSize: params.pageSize,
    total: countResult?.count ?? 0,
  });

  const items = await db
    .select({
      id: ragTelemetryLog.id,
      actorId: ragTelemetryLog.actorId,
      actorEmail: user.email,
      chatId: ragTelemetryLog.chatId,
      source: ragTelemetryLog.source,
      model: ragTelemetryLog.model,
      promptTokens: ragTelemetryLog.promptTokens,
      completionTokens: ragTelemetryLog.completionTokens,
      totalTokens: ragTelemetryLog.totalTokens,
      metadata: ragTelemetryLog.metadata,
      createdAt: ragTelemetryLog.createdAt,
    })
    .from(ragTelemetryLog)
    .leftJoin(user, eq(ragTelemetryLog.actorId, user.id))
    .where(gte(ragTelemetryLog.createdAt, cutoff))
    .orderBy(desc(ragTelemetryLog.createdAt))
    .limit(pagination.pageSize)
    .offset((pagination.page - 1) * pagination.pageSize);

  return {
    items: items as RagTelemetryRow[],
    pagination,
  };
}
