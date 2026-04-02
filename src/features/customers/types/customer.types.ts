import type { PaginationMeta } from "@/shared/types";

export interface CustomerSummary extends Record<string, unknown> {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  segment: string | null;
  tags?: string[];
  totalRevenue?: string | null;
  ltv?: string | null;
  lastPurchaseAt?: string | null;
  churnRiskScore?: number | null;
}

export interface CustomerListParams {
  view: "all" | "top" | "churn";
  query: string;
  sort: "name" | "revenue";
  page: number;
}

export interface CustomerPaginatedResult {
  customers: CustomerSummary[];
  pagination: PaginationMeta | null;
}
