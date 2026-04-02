import type { PaginatedResult } from "@/backend/lib";

import type { IAuditRepository } from "./audit.repository.interface";
import type { AuditLogEntry, AuditQuery, CreateAuditLogInput } from "./audit.types";

export interface IAuditService {
  log(input: CreateAuditLogInput): Promise<void>;
}

export class AuditService implements IAuditService {
  constructor(private readonly auditRepository: IAuditRepository) {}

  async log(input: CreateAuditLogInput): Promise<void> {
    await this.auditRepository.create(input);
  }

  async query(filters: AuditQuery): Promise<PaginatedResult<AuditLogEntry>> {
    return this.auditRepository.findAll(filters);
  }
}
