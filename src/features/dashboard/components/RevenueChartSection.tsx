"use client";

import { ChartCard, BarChart } from "@/components/charts";

import type { RevenueDataPoint } from "../types";

export function RevenueChartSection({ data }: Readonly<{ data: RevenueDataPoint[] }>) {
  return (
    <ChartCard description="Recent revenue totals from the analytics API." title="Revenue">
      <BarChart data={data.map((point) => ({ name: point.date, value: point.revenue }))} />
    </ChartCard>
  );
}
