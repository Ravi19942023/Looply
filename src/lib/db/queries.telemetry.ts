import { and, asc, count, desc, eq, sql, sum } from "drizzle-orm";

import { db } from "@/backend/db";
import { chats, telemetryLogs, users } from "@/backend/db/schema";

export async function getTelemetrySummary() {
  const [result] = await db
    .select({
      totalTokens: sum(telemetryLogs.totalTokens).mapWith(Number),
      chatTokens: sql<number>`CAST(COALESCE(SUM(CASE WHEN ${telemetryLogs.source} = 'llm:chat' THEN ${telemetryLogs.totalTokens} ELSE 0 END), 0) AS INTEGER)`,
      ragTokens: sql<number>`CAST(COALESCE(SUM(CASE WHEN ${telemetryLogs.source} LIKE 'rag:%' THEN ${telemetryLogs.totalTokens} ELSE 0 END), 0) AS INTEGER)`,
    })
    .from(telemetryLogs);

  return {
    totalTokens: result?.totalTokens ?? 0,
    chatTokens: result?.chatTokens ?? 0,
    ragTokens: result?.ragTokens ?? 0,
  };
}

export async function getChatSessionsTelemetryPaginated({
  limit,
  offset,
}: {
  limit: number;
  offset: number;
}) {
  const sq = db
    .select({
      chatId: telemetryLogs.chatId,
      totalTokens: sum(telemetryLogs.totalTokens).mapWith(Number).as("totalTokens"),
      promptTokens: sum(telemetryLogs.promptTokens).mapWith(Number).as("promptTokens"),
      completionTokens: sum(telemetryLogs.completionTokens).mapWith(Number).as("completionTokens"),
      startedAt: sql<Date>`MIN(${telemetryLogs.createdAt})`.as("startedAt"),
      lastActivityAt: sql<Date>`MAX(${telemetryLogs.createdAt})`.as("lastActivityAt"),
      model: sql<string | null>`(${telemetryLogs.model})`.as("model"),
    })
    .from(telemetryLogs)
    .where(eq(telemetryLogs.source, "llm:chat"))
    .groupBy(telemetryLogs.chatId, telemetryLogs.model)
    .as("sq");

  const [totalCountResult] = await db.select({ count: count() }).from(sq);
  const totalCount = totalCountResult?.count ?? 0;

  const rows = await db
    .select({
      chatId: sq.chatId,
      title: chats.title,
      actorEmail: users.email,
      model: sq.model,
      totalTokens: sq.totalTokens,
      promptTokens: sq.promptTokens,
      completionTokens: sq.completionTokens,
      startedAt: sq.startedAt,
      lastActivityAt: sq.lastActivityAt,
    })
    .from(sq)
    .leftJoin(chats, eq(sq.chatId, chats.id))
    .leftJoin(users, eq(chats.actorId, users.id))
    .orderBy(desc(sq.lastActivityAt))
    .limit(limit)
    .offset(offset);

  return {
    rows,
    totalCount,
    hasMore: offset + limit < totalCount,
  };
}

export async function getRagTelemetryPaginated({
  limit,
  offset,
}: {
  limit: number;
  offset: number;
}) {
  const baseQuery = db
    .select()
    .from(telemetryLogs)
    .where(sql`${telemetryLogs.source} LIKE 'rag:%'`);

  const [totalCountResult] = await db
    .select({ count: count(telemetryLogs.id) })
    .from(telemetryLogs)
    .where(sql`${telemetryLogs.source} LIKE 'rag:%'`);
    
  const totalCount = totalCountResult?.count ?? 0;

  const rows = await db
    .select({
      id: telemetryLogs.id,
      source: telemetryLogs.source,
      model: telemetryLogs.model,
      totalTokens: telemetryLogs.totalTokens,
      promptTokens: telemetryLogs.promptTokens,
      completionTokens: telemetryLogs.completionTokens,
      createdAt: telemetryLogs.createdAt,
      actorEmail: users.email,
      chatTitle: chats.title,
    })
    .from(telemetryLogs)
    .leftJoin(users, eq(telemetryLogs.actorId, users.id))
    .leftJoin(chats, eq(telemetryLogs.chatId, chats.id))
    .where(sql`${telemetryLogs.source} LIKE 'rag:%'`)
    .orderBy(desc(telemetryLogs.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    rows,
    totalCount,
    hasMore: offset + limit < totalCount,
  };
}
