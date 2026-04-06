"use client";

type CustomerResult = {
  avgOrderValue?: string | number | null;
  churnRiskScore?: string | number | null;
  email: string;
  lastPurchaseAt?: string | Date | null;
  ltv?: string | number | null;
  name: string;
  orderCount?: number | null;
  phone?: string | null;
  segment?: string | null;
  tags?: string[] | null;
  totalRevenue?: string | number | null;
};

function formatCurrency(value: string | number | null | undefined) {
  const numericValue = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency",
    maximumFractionDigits: 0,
  }).format(numericValue);
}

export function CustomerResultsCard({
  customers,
  title,
}: Readonly<{
  customers: CustomerResult[];
  title: string;
}>) {
  return (
    <div className="w-[min(100%,560px)] rounded-2xl border border-border/50 bg-card/60 p-4 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-medium text-sm">{title}</div>
        <div className="text-muted-foreground text-xs">
          {customers.length} result{customers.length === 1 ? "" : "s"}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/40">
        <div className="grid grid-cols-[1.4fr_1fr_1fr] bg-muted/40 px-3 py-2 text-[11px] font-medium text-muted-foreground">
          <span>Customer</span>
          <span>Segment</span>
          <span className="text-right">Value</span>
        </div>

        <div className="divide-y divide-border/30">
          {customers.map((customer) => (
            <div
              className="grid grid-cols-[1.4fr_1fr_1fr] gap-3 px-3 py-3 text-sm"
              key={customer.email}
            >
              <div className="min-w-0">
                <div className="truncate font-medium">{customer.name}</div>
                <div className="truncate text-[12px] text-muted-foreground">
                  {customer.email}
                </div>
              </div>
              <div className="min-w-0">
                <div className="truncate">{customer.segment ?? "general"}</div>
                <div className="truncate text-[12px] text-muted-foreground">
                  {customer.orderCount ?? 0} orders
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">
                  {formatCurrency(customer.totalRevenue ?? customer.ltv)}
                </div>
                <div className="text-[12px] text-muted-foreground">
                  LTV {formatCurrency(customer.ltv)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
