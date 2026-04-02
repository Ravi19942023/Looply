import { uuid, timestamp, pgTable, numeric, integer, real } from "drizzle-orm/pg-core";

import { customers } from "./customers.schema";

export const customerMetrics = pgTable("customer_metrics", {
  customerId: uuid("customer_id")
    .primaryKey()
    .references(() => customers.id, { onDelete: "cascade" }),
  totalRevenue: numeric("total_revenue", { precision: 12, scale: 2 }).default("0"),
  ltv: numeric("ltv", { precision: 12, scale: 2 }).default("0"),
  orderCount: integer("order_count").default(0),
  avgOrderValue: numeric("avg_order_value", { precision: 10, scale: 2 }),
  lastPurchaseAt: timestamp("last_purchase_at", { withTimezone: true }),
  churnRiskScore: real("churn_risk_score").default(0),
  recencyScore: real("recency_score").default(0),
  frequencyScore: real("frequency_score").default(0),
  monetaryScore: real("monetary_score").default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type CustomerMetrics = typeof customerMetrics.$inferSelect;
export type NewCustomerMetrics = typeof customerMetrics.$inferInsert;
