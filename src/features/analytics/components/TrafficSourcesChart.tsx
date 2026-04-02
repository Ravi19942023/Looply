"use client";

import { ChartCard, DonutChart } from "@/components/charts";

import type { RecentOrder } from "../types";

function buildStatusData(orders: RecentOrder[]) {
  const counts = new Map<string, number>();

  for (const order of orders) {
    const key = order.status || "unknown";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([name, value]) => ({
    name,
    value,
  }));
}

export function TrafficSourcesChart({ orders }: Readonly<{ orders: RecentOrder[] }>) {
  return (
    <ChartCard description="Order status distribution in the current operational dataset." title="Status mix">
      <DonutChart data={buildStatusData(orders)} />
    </ChartCard>
  );
}
