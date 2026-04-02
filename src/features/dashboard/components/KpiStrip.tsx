"use client";

import { ReceiptText, Users, Wallet } from "lucide-react";
import { KpiCard } from "@/components/data-display";
import type { DashboardKpi } from "../types";

function getIcon(label: string) {
  switch (label.toLowerCase()) {
    case "revenue":
      return <Wallet aria-hidden="true" size={18} />;
    case "orders":
      return <ReceiptText aria-hidden="true" size={18} />;
    default:
      return <Users aria-hidden="true" size={18} />;
  }
}

export function KpiStrip({
  items,
  isLoading,
}: Readonly<{
  items: DashboardKpi[];
  isLoading: boolean;
}>) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <KpiCard
          key={item.label}
          formatType={item.formatType}
          icon={getIcon(item.label)}
          label={item.label}
          loading={isLoading}
          previousValue={item.previousValue}
          tone={item.trend === "up" ? "positive" : item.trend === "down" ? "warning" : "default"}
          trend={item.trend}
          trendPercentage={item.trendPercentage}
          value={item.value}
        />
      ))}
    </div>
  );
}

