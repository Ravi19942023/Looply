import { count, desc, eq } from "drizzle-orm";

import { db } from "@/backend/db";
import { auditLogs, toolLogs, users, chats } from "@/backend/db/schema";

export async function getAuditLogsPaginated({
  limit,
  offset,
}: {
  limit: number;
  offset: number;
}) {
  const [totalCountResult] = await db
    .select({ count: count(auditLogs.id) })
    .from(auditLogs);
    
  const totalCount = totalCountResult?.count ?? 0;

  const rows = await db
    .select({
      id: auditLogs.id,
      event: auditLogs.event,
      actorEmail: users.email,
      actorId: auditLogs.actorId,
      resourceType: auditLogs.resourceType,
      resourceId: auditLogs.resourceId,
      ipAddress: auditLogs.ipAddress,
      timestamp: auditLogs.timestamp,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.actorId, users.id))
    .orderBy(desc(auditLogs.timestamp))
    .limit(limit)
    .offset(offset);

  return {
    rows,
    totalCount,
    hasMore: offset + limit < totalCount,
  };
}

export async function getToolLogsPaginated({
  limit,
  offset,
}: {
  limit: number;
  offset: number;
}) {
  const [totalCountResult] = await db
    .select({ count: count(toolLogs.id) })
    .from(toolLogs);
    
  const totalCount = totalCountResult?.count ?? 0;

  const rows = await db
    .select({
      id: toolLogs.id,
      toolName: toolLogs.toolName,
      stepIndex: toolLogs.stepIndex,
      chatTitle: chats.title,
      chatId: toolLogs.chatId,
      input: toolLogs.input,
      output: toolLogs.output,
      createdAt: toolLogs.createdAt,
    })
    .from(toolLogs)
    .leftJoin(chats, eq(toolLogs.chatId, chats.id))
    .orderBy(desc(toolLogs.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    rows,
    totalCount,
    hasMore: offset + limit < totalCount,
  };
}
