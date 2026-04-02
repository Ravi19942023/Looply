"use client";

import { Card } from "@/components/atoms";
import { DataTable } from "@/components/data-display";

import type { RecentOrder } from "../types";

interface TopItem extends Record<string, unknown> {
  id: string;
  product: string;
  orders: number;
  revenue: number;
}

function buildRows(orders: RecentOrder[]): TopItem[] {
  const grouped = new Map<string, TopItem>();

  for (const order of orders) {
    const existing = grouped.get(order.product);

    if (existing) {
      existing.orders += 1;
      existing.revenue += order.amount;
      continue;
    }

    grouped.set(order.product, {
      id: order.product,
      product: order.product,
      orders: 1,
      revenue: order.amount,
    });
  }

  return Array.from(grouped.values());
}

const columns = [
  { key: "product", header: "Product" },
  { key: "orders", header: "Orders", align: "right" as const },
  {
    key: "revenue",
    header: "Revenue",
    align: "right" as const,
    render: (row: TopItem) => `$${row.revenue.toFixed(2)}`,
  },
];

export function TopPagesTable({ orders }: Readonly<{ orders: RecentOrder[] }>) {
  return (
    <Card description="Top-selling products in the current dataset." title="Top products">
      <DataTable
        caption="Top products"
        columns={columns}
        data={buildRows(orders)}
        getRowId={(row) => row.id}
      />
    </Card>
  );
}
