"use client";

import { ChartCard, LineChart } from "@/components/charts";

import type { RevenueDataPoint } from "../types";

export function UsersOverTimeChart({ data }: Readonly<{ data: RevenueDataPoint[] }>) {
  return (
    <ChartCard description="Operational trend for the selected period." title="Revenue over time">
      <LineChart data={data.map((point) => ({ name: point.date, value: point.revenue }))} />
    </ChartCard>
  );
}
