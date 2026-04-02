import { desc, eq, gte, sql } from "drizzle-orm";

import { db } from "@/backend/db";
import { customers, products, transactions } from "@/backend/db/schema";

import type { ITransactionRepository } from "./transaction.repository.interface";
import type { AnalyticsSummary, RecentOrder, RevenueDataPoint } from "./analytics.types";

function getWindowStart(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function buildTrend(current: number, previous: number): {
  trend: "up" | "down" | "neutral";
  trendPercentage: number;
} {
  if (previous === 0 && current === 0) {
    return { trend: "neutral", trendPercentage: 0 };
  }

  if (previous === 0) {
    return { trend: "up", trendPercentage: 100 };
  }

  const delta = ((current - previous) / previous) * 100;
  if (delta > 0) {
    return { trend: "up", trendPercentage: Number(delta.toFixed(1)) };
  }
  if (delta < 0) {
    return { trend: "down", trendPercentage: Number(Math.abs(delta).toFixed(1)) };
  }
  return { trend: "neutral", trendPercentage: 0 };
}

export class TransactionRepository implements ITransactionRepository {
  async getSummary(days: number): Promise<AnalyticsSummary> {
    const startDate = getWindowStart(days);
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - days);

    const [currentAgg, previousAgg, recentOrdersRaw, revenueRows, customerCount, avgOrderValue] =
      await Promise.all([
        db
          .select({
            revenue: sql<string>`coalesce(sum(${transactions.amount}), 0)`,
            orderCount: sql<number>`count(*)`,
          })
          .from(transactions)
          .where(gte(transactions.createdAt, startDate)),
        db
          .select({
            revenue: sql<string>`coalesce(sum(${transactions.amount}), 0)`,
            orderCount: sql<number>`count(*)`,
          })
          .from(transactions)
          .where(gte(transactions.createdAt, previousStartDate)),
        db
          .select({
            id: transactions.id,
            customer: customers.name,
            product: products.name,
            amount: transactions.amount,
            date: transactions.createdAt,
            status: transactions.status,
          })
          .from(transactions)
          .innerJoin(customers, eq(transactions.customerId, customers.id))
          .innerJoin(products, eq(transactions.productId, products.id))
          .orderBy(desc(transactions.createdAt))
          .limit(8),
        db
          .select({
            date: sql<string>`to_char(date_trunc('day', ${transactions.createdAt}), 'YYYY-MM-DD')`,
            revenue: sql<string>`coalesce(sum(${transactions.amount}), 0)`,
          })
          .from(transactions)
          .where(gte(transactions.createdAt, startDate))
          .groupBy(sql`date_trunc('day', ${transactions.createdAt})`)
          .orderBy(sql`date_trunc('day', ${transactions.createdAt}) asc`),
        db.select({ total: sql<number>`count(*)` }).from(customers),
        db
          .select({
            average: sql<string>`coalesce(avg(${transactions.amount}), 0)`,
          })
          .from(transactions)
          .where(gte(transactions.createdAt, startDate)),
      ]);

    const currentRevenue = Number(currentAgg[0]?.revenue ?? 0);
    const previousRevenue = Number(previousAgg[0]?.revenue ?? 0);
    const currentOrders = Number(currentAgg[0]?.orderCount ?? 0);
    const previousOrders = Number(previousAgg[0]?.orderCount ?? 0);
    const customerTotal = Number(customerCount[0]?.total ?? 0);
    const averageOrder = Number(avgOrderValue[0]?.average ?? 0);

    const revenueTrend = buildTrend(currentRevenue, previousRevenue);
    const orderTrend = buildTrend(currentOrders, previousOrders);

    const recentOrders: RecentOrder[] = recentOrdersRaw.map((row) => ({
      id: row.id,
      customer: row.customer,
      product: row.product,
      amount: Number(row.amount),
      date: row.date.toISOString(),
      status: row.status ?? "completed",
    }));

    const revenueData: RevenueDataPoint[] = revenueRows.map((row) => ({
      date: row.date,
      revenue: Number(row.revenue),
    }));

    return {
      kpis: [
        {
          label: "Revenue",
          value: currentRevenue,
          previousValue: previousRevenue,
          formatType: "currency",
          ...revenueTrend,
        },
        {
          label: "Orders",
          value: currentOrders,
          previousValue: previousOrders,
          formatType: "number",
          ...orderTrend,
        },
        {
          label: "Customers",
          value: customerTotal,
          previousValue: customerTotal,
          formatType: "number",
          trend: "neutral",
          trendPercentage: 0,
        },
        {
          label: "Avg Order Value",
          value: averageOrder,
          previousValue: averageOrder,
          formatType: "currency",
          trend: "neutral",
          trendPercentage: 0,
        },
      ],
      revenueData,
      recentOrders,
    };
  }
}
