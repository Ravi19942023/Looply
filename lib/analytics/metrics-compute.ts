import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const CHURN_CENTER_DAYS = 60;
const CHURN_STEEPNESS = 15;

const client = postgres(process.env.POSTGRES_URL ?? "");
const db = drizzle(client);

export type MetricsComputeResult = {
  processed: number;
};

export async function recomputeCustomerMetrics(): Promise<MetricsComputeResult> {
  const result = await db.execute(sql`
    WITH aggregated AS (
      SELECT
        "customerId",
        SUM("amount"::numeric) AS total_revenue,
        COUNT(*)::int AS order_count,
        AVG("amount"::numeric) AS avg_order_value,
        MAX("createdAt") AS last_purchase_at,
        EXTRACT(EPOCH FROM (now() - MAX("createdAt"))) / 86400.0 AS days_since_last,
        GREATEST(
          EXTRACT(EPOCH FROM (now() - MIN("createdAt"))) / (86400.0 * 30),
          1
        ) AS months_active
      FROM "Transaction"
      GROUP BY "customerId"
    ),
    normalised AS (
      SELECT
        *,
        MAX(avg_order_value) OVER () AS max_avg_order
      FROM aggregated
    )
    INSERT INTO "CustomerMetric" (
      "customerId",
      "totalRevenue",
      "ltv",
      "orderCount",
      "avgOrderValue",
      "lastPurchaseAt",
      "recencyScore",
      "frequencyScore",
      "monetaryScore",
      "churnRiskScore",
      "updatedAt"
    )
    SELECT
      "customerId",
      total_revenue,
      total_revenue AS ltv,
      order_count,
      avg_order_value,
      last_purchase_at,
      (1.0 / (days_since_last + 1))::numeric(4, 2) AS recency_score,
      (order_count / months_active)::numeric(4, 2) AS frequency_score,
      CASE
        WHEN max_avg_order > 0 THEN (avg_order_value / max_avg_order)::numeric(4, 2)
        ELSE 0
      END AS monetary_score,
      (
        1.0 / (
          1.0 + exp(-((days_since_last - ${CHURN_CENTER_DAYS}) / ${CHURN_STEEPNESS}))
        )
      )::numeric(4, 2) AS churn_risk_score,
      now()
    FROM normalised
    ON CONFLICT ("customerId") DO UPDATE SET
      "totalRevenue" = EXCLUDED."totalRevenue",
      "ltv" = EXCLUDED."ltv",
      "orderCount" = EXCLUDED."orderCount",
      "avgOrderValue" = EXCLUDED."avgOrderValue",
      "lastPurchaseAt" = EXCLUDED."lastPurchaseAt",
      "recencyScore" = EXCLUDED."recencyScore",
      "frequencyScore" = EXCLUDED."frequencyScore",
      "monetaryScore" = EXCLUDED."monetaryScore",
      "churnRiskScore" = EXCLUDED."churnRiskScore",
      "updatedAt" = EXCLUDED."updatedAt"
  `);

  const queryResult = result as { rowCount?: number } | unknown[];
  const processed = Array.isArray(queryResult)
    ? queryResult.length
    : ((queryResult as { rowCount?: number }).rowCount ?? 0);

  return { processed };
}
