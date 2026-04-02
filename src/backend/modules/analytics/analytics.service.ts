import type { IAuditService } from "@/backend/modules/audit";
import { AUDIT_EVENTS } from "@/backend/modules/audit";

import type { ITransactionRepository } from "./transaction.repository.interface";
import type { AnalyticsSummary } from "./analytics.types";

export class AnalyticsService {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly auditService: IAuditService,
  ) {}

  async getSummary(actorId: string, days: number): Promise<AnalyticsSummary> {
    const summary = await this.transactionRepository.getSummary(days);
    await this.auditService.log({
      actorId,
      event: AUDIT_EVENTS.CUSTOMER_LIST_VIEWED,
      metadata: {
        type: "analytics.summary",
        days,
      },
    });
    return summary;
  }
}
