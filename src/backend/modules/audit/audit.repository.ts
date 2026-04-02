import { and, desc, eq, sql } from "drizzle-orm";

import { buildPaginationMeta } from "@/backend/lib";
import { db } from "@/backend/db";
import { auditLogs } from "@/backend/db/schema";

import type { IAuditRepository } from "./audit.repository.interface";
import type { AuditLogEntry, AuditQuery, CreateAuditLogInput } from "./audit.types";

export class AuditRepository implements IAuditRepository {
  async create(input: CreateAuditLogInput): Promise<void> {
    await db.insert(auditLogs).values({
      actorId: input.actorId,
      event: input.event,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      metadata: input.metadata ?? {},
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });
  }

  async findAll(query: AuditQuery): Promise<{ items: AuditLogEntry[]; pagination: ReturnType<typeof buildPaginationMeta> }> {
    const offset = (query.page - 1) * query.pageSize;
    const filters = [
      query.event ? eq(auditLogs.event, query.event) : undefined,
      query.actorId ? eq(auditLogs.actorId, query.actorId) : undefined,
    ].filter(Boolean);

    const whereClause = filters.length > 0 ? and(...filters) : undefined;

    const [items, totalRows] = await Promise.all([
      db.query.auditLogs.findMany({
        where: whereClause,
        orderBy: desc(auditLogs.timestamp),
        limit: query.pageSize,
        offset,
      }),
      db
        .select({ count: sql<number>`count(*)` })
        .from(auditLogs)
        .where(whereClause),
    ]);

    const total = Number(totalRows[0]?.count ?? 0);

    return {
      items: items as AuditLogEntry[],
      pagination: buildPaginationMeta(query.page, query.pageSize, total),
    };
  }
}
