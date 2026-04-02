import { API_ENDPOINTS } from "@/shared/constants";
import { apiClient } from "@/lib/api";

import type {
  DashboardData,
  DashboardKpi,
  ProfitLossDataPoint,
  RecentOrder,
  RevenueDataPoint,
} from "../types";

interface AnalyticsSummaryResponse {
  kpis: DashboardKpi[];
  revenueData: RevenueDataPoint[];
  recentOrders: RecentOrder[];
}

function deriveProfitLossData(revenueData: RevenueDataPoint[], orders: RecentOrder[]): ProfitLossDataPoint[] {
  const lossesByDate = new Map<string, number>();

  for (const order of orders) {
    if (order.status.toLowerCase() !== "completed") {
      lossesByDate.set(order.date, (lossesByDate.get(order.date) ?? 0) + order.amount);
    }
  }

  return revenueData.map((point) => ({
    date: point.date,
    profit: point.revenue,
    loss: lossesByDate.get(point.date) ?? 0,
  }));
}

export async function fetchDashboardData(period: string): Promise<DashboardData> {
  const summary = await apiClient<AnalyticsSummaryResponse>(`${API_ENDPOINTS.ANALYTICS}?period=${period}`);

  return {
    kpis: summary.kpis,
    revenueData: summary.revenueData,
    recentOrders: summary.recentOrders,
    profitLossData: deriveProfitLossData(summary.revenueData, summary.recentOrders),
  };
}
