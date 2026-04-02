"use client";

import { Card } from "@/components/atoms";
import { DataTable } from "@/components/data-display";
import { EmptyState } from "@/components/feedback";

import type { RecentOrder } from "../types";

const columns = [
  { key: "customer", header: "Customer" },
  { key: "product", header: "Product" },
  {
    key: "amount",
    header: "Amount",
    render: (row: RecentOrder) => `$${row.amount.toFixed(2)}`,
    align: "right" as const,
  },
  { key: "status", header: "Status", align: "right" as const },
];

function getRowId(row: RecentOrder) {
  return row.id;
}

export function RecentOrdersSection({
  orders,
  isLoading,
}: Readonly<{
  orders: RecentOrder[];
  isLoading: boolean;
}>) {
  return (
    <Card description="Latest transactions from the live analytics API." title="Recent orders">
      <DataTable
        caption="Recent orders"
        columns={columns}
        data={orders}
        emptyState={
          <EmptyState
            description="No recent orders are available for the selected period."
            title="No recent orders"
          />
        }
        getRowId={getRowId}
        isLoading={isLoading}
      />
    </Card>
  );
}
