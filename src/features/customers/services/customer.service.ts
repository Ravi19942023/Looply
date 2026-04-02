import { API_ENDPOINTS } from "@/shared/constants";
import { ApiClientError, apiClient } from "@/lib/api";

import type { CustomerListParams, CustomerPaginatedResult, CustomerSummary } from "../types";

function sortRows(rows: CustomerSummary[], sort: CustomerListParams["sort"]) {
  if (sort === "revenue") {
    return [...rows].sort(
      (left, right) => Number(right.totalRevenue ?? right.ltv ?? 0) - Number(left.totalRevenue ?? left.ltv ?? 0),
    );
  }

  return [...rows].sort((left, right) => left.name.localeCompare(right.name));
}

async function fetchPaginated(path: string): Promise<{ data: unknown; pagination?: import("@/shared/types").PaginationMeta }> {
  const response = await fetch(path, { credentials: "include" });
  const payload = await response.json();

  if (!response.ok || !payload.success) {
    throw new ApiClientError(response.status, payload);
  }

  return {
    data: payload.data,
    pagination: payload.meta?.pagination,
  };
}

export async function fetchCustomers(params: CustomerListParams): Promise<CustomerPaginatedResult> {
  const PAGE_SIZE = 10;

  if (params.view === "top") {
    const rows = await apiClient<CustomerSummary[]>(`${API_ENDPOINTS.CUSTOMERS_TOP}?limit=10`);
    return { customers: sortRows(rows, params.sort), pagination: null };
  }

  if (params.view === "churn") {
    const rows = await apiClient<CustomerSummary[]>(`${API_ENDPOINTS.CUSTOMERS_CHURN}?daysSinceLastPurchase=60`);
    return { customers: sortRows(rows, params.sort), pagination: null };
  }

  const query = params.query ? `&query=${encodeURIComponent(params.query)}` : "";
  const { data, pagination } = await fetchPaginated(
    `${API_ENDPOINTS.CUSTOMERS}?page=${params.page}&pageSize=${PAGE_SIZE}${query}`,
  );

  return {
    customers: sortRows(data as CustomerSummary[], params.sort),
    pagination: pagination ?? null,
  };
}

export async function fetchCustomerLtv(id: string): Promise<CustomerSummary> {
  return apiClient<CustomerSummary>(API_ENDPOINTS.CUSTOMER_LTV(id));
}
