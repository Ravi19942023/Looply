import type { PaginatedResult } from "@/backend/lib";

import type { AuditLogEntry, AuditQuery, CreateAuditLogInput } from "./audit.types";

export interface IAuditRepository {
  create(input: CreateAuditLogInput): Promise<void>;
  findAll(query: AuditQuery): Promise<PaginatedResult<AuditLogEntry>>;
}
