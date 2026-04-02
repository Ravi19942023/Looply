import type { IAuditService } from "@/backend/modules/audit";
import { AUDIT_EVENTS } from "@/backend/modules/audit";

import type { ICustomerRepository } from "./customer.repository.interface";
import { CHURN_THRESHOLD_DAYS } from "./customer.constants";
import type { CustomerListResult, CustomerWithMetrics } from "./customer.types";

export class CustomerService {
  constructor(
    private readonly customerRepository: ICustomerRepository,
    private readonly auditService: IAuditService,
  ) {}

  async list(
    params: { page: number; pageSize: number },
    actorId: string,
    query?: string,
  ): Promise<CustomerListResult> {
    const result = await this.customerRepository.findAll(params, query);
    await this.auditService.log({
      actorId,
      event: AUDIT_EVENTS.CUSTOMER_LIST_VIEWED,
      metadata: {
        page: params.page,
        pageSize: params.pageSize,
        query,
      },
    });
    return result;
  }

  async getTopCustomers(limit: number, actorId: string): Promise<CustomerWithMetrics[]> {
    const result = await this.customerRepository.findTopByRevenue(limit);
    await this.auditService.log({
      actorId,
      event: AUDIT_EVENTS.CUSTOMER_LIST_VIEWED,
      metadata: {
        limit,
        type: "top",
      },
    });
    return result;
  }

  async getChurnRiskCustomers(
    actorId: string,
    daysSinceLastPurchase = CHURN_THRESHOLD_DAYS,
  ): Promise<CustomerWithMetrics[]> {
    const result = await this.customerRepository.findChurnRisk(daysSinceLastPurchase);
    await this.auditService.log({
      actorId,
      event: AUDIT_EVENTS.CUSTOMER_LIST_VIEWED,
      metadata: {
        daysSinceLastPurchase,
        type: "churn",
      },
    });
    return result;
  }

  async getCustomerLtv(id: string, actorId: string): Promise<CustomerWithMetrics | null> {
    const result = await this.customerRepository.getLtvById(id);
    await this.auditService.log({
      actorId,
      event: AUDIT_EVENTS.CUSTOMER_LIST_VIEWED,
      resourceType: "customer",
      resourceId: id,
      metadata: {
        type: "ltv",
      },
    });

    return result;
  }

  async searchCustomers(options: any, actorId: string): Promise<CustomerListResult> {
    const result = await this.customerRepository.search(options);
    await this.auditService.log({
      actorId,
      event: AUDIT_EVENTS.CUSTOMER_LIST_VIEWED,
      metadata: {
        type: "advanced_search",
        filters: options.filters,
        logic: options.logic,
      },
    });
    return result;
  }
}
