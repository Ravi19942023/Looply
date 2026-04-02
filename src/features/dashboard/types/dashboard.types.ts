export interface DashboardKpi {
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

export interface ProfitLossDataPoint {
  date: string;
  profit: number;
  loss: number;
}

export interface RecentOrder extends Record<string, unknown> {
  id: string;
  customer: string;
  product: string;
  amount: number;
  date: string;
  status: string;
}

export interface DashboardData {
  kpis: DashboardKpi[];
  revenueData: RevenueDataPoint[];
  profitLossData: ProfitLossDataPoint[];
  recentOrders: RecentOrder[];
}
