import type { PaginatedResult, PaginationParams } from "@/backend/lib";

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  segment: string | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerWithMetrics extends Customer {
  totalRevenue: string | null;
  ltv: string | null;
  orderCount: number | null;
  avgOrderValue: string | null;
  lastPurchaseAt: Date | null;
  churnRiskScore: number | null;
}

export enum FilterOperator {
  EQUALS = "eq",
  NOT_EQUALS = "neq",
  CONTAINS = "contains",
  GREATER_THAN = "gt",
  LESS_THAN = "lt",
  GREATER_THAN_OR_EQUAL = "gte",
  LESS_THAN_OR_EQUAL = "lte",
  IN = "in",
  IS_NULL = "is_null",
  IS_NOT_NULL = "is_not_null",
}

export type CustomerFilterField = 
  | "name" 
  | "email" 
  | "phone" 
  | "segment" 
  | "totalRevenue" 
  | "ltv" 
  | "orderCount" 
  | "avgOrderValue" 
  | "churnRiskScore" 
  | "lastPurchaseAt";

export interface CustomerSearchFilter {
  field: CustomerFilterField;
  operator: FilterOperator;
  value?: any;
}

export interface CustomerSearchOptions {
  filters?: CustomerSearchFilter[];
  logic?: "and" | "or";
  sortBy?: CustomerFilterField;
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface CustomerListFilters extends PaginationParams {
  query?: string;
  advanced?: CustomerSearchOptions;
}

export type CustomerListResult = PaginatedResult<CustomerWithMetrics>;
