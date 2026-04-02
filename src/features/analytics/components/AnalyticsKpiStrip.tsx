"use client";

import { KpiCard } from "@/components/data-display";
import { cn } from "@/lib/utils";
import type { AnalyticsKpi } from "../types";

export function AnalyticsKpiStrip({
  items,
  isLoading,
  className,
}: Readonly<{
  items: AnalyticsKpi[];
  isLoading: boolean;
  className?: string;
}>) {
  return (
    <div className={cn(
      "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",
      className
    )}>
      {items.map((item) => (
        <KpiCard
          key={item.label}
          formatType={item.formatType}
          label={item.label}
          loading={isLoading}
          previousValue={item.previousValue}
          trend={item.trend}
          trendPercentage={item.trendPercentage}
          value={item.value}
        />
      ))}
    </div>
  );
}

