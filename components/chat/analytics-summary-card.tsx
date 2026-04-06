"use client";

type AnalyticsKpi = {
  format: string;
  label: string;
  value: number;
};

type RecentOrder = {
  amount: string | number;
  createdAt?: Date | string;
  customerId?: string;
  id: string;
  product: string;
  status: string;
};

function formatValue(format: string, value: number) {
  if (format === "currency") {
    return new Intl.NumberFormat("en-US", {
      currency: "USD",
      style: "currency",
      maximumFractionDigits: 0,
    }).format(value);
  }

  return new Intl.NumberFormat("en-US").format(value);
}

export function AnalyticsSummaryCard({
  summary,
}: Readonly<{
  summary: {
    days: number;
    kpis: AnalyticsKpi[];
    recentOrders: RecentOrder[];
  };
}>) {
  return (
    <div className="w-[min(100%,620px)] rounded-2xl border border-border/50 bg-card/60 p-4 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex items-center justify-between">
        <div className="font-medium text-sm">Analytics Summary</div>
        <div className="text-muted-foreground text-xs">
          Last {summary.days} days
        </div>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        {summary.kpis.map((kpi) => (
          <div
            className="rounded-xl border border-border/40 bg-background/70 p-3"
            key={kpi.label}
          >
            <div className="text-muted-foreground text-[11px] uppercase tracking-wide">
              {kpi.label}
            </div>
            <div className="mt-1 font-semibold text-lg">
              {formatValue(kpi.format, kpi.value)}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border/40">
        <div className="border-b border-border/30 bg-muted/40 px-3 py-2 text-[11px] font-medium text-muted-foreground">
          Recent Orders
        </div>
        <div className="divide-y divide-border/30">
          {summary.recentOrders.slice(0, 5).map((order) => (
            <div
              className="flex items-center justify-between gap-3 px-3 py-3 text-sm"
              key={order.id}
            >
              <div className="min-w-0">
                <div className="truncate font-medium">{order.product}</div>
                <div className="text-[12px] text-muted-foreground">
                  {order.status}
                </div>
              </div>
              <div className="font-medium">
                {formatValue("currency", Number(order.amount))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
