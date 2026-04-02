import type { PaginatedResult, PaginationParams } from "@/backend/lib";

import type { Customer, CustomerWithMetrics } from "./customer.types";

export interface ICustomerRepository {
  findAll(params: PaginationParams, query?: string): Promise<PaginatedResult<CustomerWithMetrics>>;
  findTopByRevenue(limit: number): Promise<CustomerWithMetrics[]>;
  findChurnRisk(daysSinceLastPurchase: number): Promise<CustomerWithMetrics[]>;
  getLtvById(id: string): Promise<CustomerWithMetrics | null>;
  search(options: any): Promise<PaginatedResult<CustomerWithMetrics>>;
}
