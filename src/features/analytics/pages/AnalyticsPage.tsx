"use client";

import { DateRangePicker } from "@/components/forms";
import { PageHeader } from "@/components/data-display";

import {
  AnalyticsKpiStrip,
  TopPagesTable,
  TrafficSourcesChart,
  UsersOverTimeChart,
} from "../components";
import { useAnalyticsSummary } from "../hooks";

export function AnalyticsPage() {
  const { summary, isLoading, error } = useAnalyticsSummary("30d");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        actions={<DateRangePicker />}
        description="Operational analytics from the live transactions, customers, and campaign surfaces."
        eyebrow="Analytics"
        title="Analytics Overview"
      />
      
      {error ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="animate-fade-up">
        <AnalyticsKpiStrip isLoading={isLoading} items={summary?.kpis ?? []} />
      </div>

      <div className="animate-fade-up [animation-delay:100ms]">
        <UsersOverTimeChart data={summary?.revenueData ?? []} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="animate-fade-up [animation-delay:200ms]">
          <TrafficSourcesChart orders={summary?.recentOrders ?? []} />
        </div>
        <div className="animate-fade-up [animation-delay:300ms]">
          <TopPagesTable orders={summary?.recentOrders ?? []} />
        </div>
      </div>
    </div>
  );
}

