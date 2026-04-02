"use client";

import { Card } from "@/components/atoms";
import { PageHeader } from "@/components/data-display";
import { EmptyState } from "@/components/feedback";
import { DateRangePicker } from "@/components/forms";

import { DASHBOARD_DEFAULT_PERIOD } from "../constants";
import {
  KpiStrip,
  ProfitLossChartSection,
  RecentOrdersSection,
  RevenueChartSection,
} from "../components";
import { useDashboardData } from "../hooks";

export function DashboardPage() {
  const { data, error, isLoading } = useDashboardData(DASHBOARD_DEFAULT_PERIOD);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        actions={<DateRangePicker />}
        description="Monitor revenue, order flow, and customer momentum using the live analytics surface."
        eyebrow="Workspace"
        title="Dashboard"
      />

      {error ? (
        <Card title="Dashboard error">
          <EmptyState description={error} title="Unable to load dashboard" />
        </Card>
      ) : null}

      <div className="animate-fade-up">
        <KpiStrip isLoading={isLoading} items={data?.kpis ?? []} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="animate-fade-up [animation-delay:100ms]">
          <RevenueChartSection data={data?.revenueData ?? []} />
        </div>
        <div className="animate-fade-up [animation-delay:200ms]">
          <ProfitLossChartSection data={data?.profitLossData ?? []} />
        </div>
      </div>

      <div className="animate-fade-up [animation-delay:300ms]">
        <RecentOrdersSection isLoading={isLoading} orders={data?.recentOrders ?? []} />
      </div>
    </div>
  );
}

