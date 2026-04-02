import { API_ENDPOINTS } from "@/shared/constants";
import { apiClient } from "@/lib/api";

import type { AnalyticsSummary } from "../types";

export async function fetchAnalyticsSummary(period: string): Promise<AnalyticsSummary> {
  return apiClient<AnalyticsSummary>(`${API_ENDPOINTS.ANALYTICS}?period=${period}`);
}
