"use client";

import { ChartCard, ComparisonChart } from "@/components/charts";
import { EmptyState } from "@/components/feedback";

import type { ProfitLossDataPoint } from "../types";

export function ProfitLossChartSection({
  data,
}: Readonly<{
  data: ProfitLossDataPoint[];
}>) {
  const nonZeroRows = data.filter((point) => point.profit > 0 || point.loss > 0);

  return (
    <ChartCard description="Operational gains versus loss-making orders in the current period." title="Profit vs loss">
      {nonZeroRows.length === 0 ? (
        <EmptyState
          description="There is not enough order status variation in the current API payload to compare profit and loss yet."
          title="No comparison data"
        />
      ) : (
        <ComparisonChart
          data={nonZeroRows.map((point) => ({
            name: point.date,
            first: point.profit,
            second: point.loss,
          }))}
          firstLabel="Profit"
          secondLabel="Loss"
        />
      )}
    </ChartCard>
  );
}
