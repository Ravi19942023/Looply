export interface AnalyticsKpi {
  label: string;
  value: number;
  previousValue: number;
  trend: "up" | "down" | "neutral";
  trendPercentage: number;
  formatType: "currency" | "number" | "percentage";
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
}

export interface RecentOrder {
  id: string;
  customer: string;
  product: string;
  amount: number;
  date: string;
  status: string;
}

export interface AnalyticsSummary {
  kpis: AnalyticsKpi[];
  revenueData: RevenueDataPoint[];
  recentOrders: RecentOrder[];
}
