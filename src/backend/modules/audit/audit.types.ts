export interface AuditLogEntry {
  id: string;
  actorId: string;
  event: string;
  resourceType?: string | null;
  resourceId?: string | null;
  metadata: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
  timestamp: Date;
}

export interface CreateAuditLogInput {
  actorId: string;
  event: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditQuery {
  page: number;
  pageSize: number;
  event?: string;
  actorId?: string;
}
