import { sql } from "drizzle-orm";

import { db } from "@/backend/db";

import { CHURN_CENTER_DAYS, CHURN_STEEPNESS } from "./metrics-compute.constants";

export interface MetricsComputeResult {
  processed: number;
}

/**
 * Computes and upserts analytics metrics for every customer that has at
 * least one transaction.
 *
 * All metrics are computed in a single bulk SQL statement to avoid N+1
 * queries and keep runtime proportional to number of distinct customers.
 *
 * Metrics computed:
 *   totalRevenue     – SUM(amount)
 *   ltv              – same as totalRevenue (simple model)
 *   orderCount       – COUNT(transactions)
 *   avgOrderValue    – totalRevenue / orderCount
 *   lastPurchaseAt   – MAX(created_at)
 *   recencyScore     – 1 / (days_since_last_purchase + 1)
 *   frequencyScore   – orderCount / months_active  (min 1 month)
 *   monetaryScore    – avgOrderValue normalised 0-1 across all customers
 *   churnRiskScore   – sigmoid((days_inactive - 60) / 15)
 */
export class MetricsComputeService {
  async recomputeAll(): Promise<MetricsComputeResult> {
    const result = await db.execute(sql`
      WITH aggregated AS (
        SELECT
          customer_id,
          SUM(amount::numeric)                                                        AS total_revenue,
          COUNT(*)::int                                                               AS order_count,
          AVG(amount::numeric)                                                        AS avg_order_value,
          MAX(created_at)                                                             AS last_purchase_at,
          EXTRACT(EPOCH FROM (now() - MAX(created_at))) / 86400.0                    AS days_since_last,
          GREATEST(
            EXTRACT(EPOCH FROM (now() - MIN(created_at))) / (86400.0 * 30),
            1
          )                                                                           AS months_active
        FROM transactions
        GROUP BY customer_id
      ),
      normalised AS (
        SELECT
          *,
          MAX(avg_order_value) OVER ()                                                AS max_avg_order
        FROM aggregated
      )
      INSERT INTO customer_metrics (
        customer_id,
        total_revenue,
        ltv,
        order_count,
        avg_order_value,
        last_purchase_at,
        recency_score,
        frequency_score,
        monetary_score,
        churn_risk_score,
        updated_at
      )
      SELECT
        customer_id,
        total_revenue,
        total_revenue                                                                  AS ltv,
        order_count,
        avg_order_value,
        last_purchase_at,
        -- Recency: higher = purchased more recently
        (1.0 / (days_since_last + 1))::real                                           AS recency_score,
        -- Frequency: orders per month of activity
        (order_count / months_active)::real                                            AS frequency_score,
        -- Monetary: normalised avg order value (0-1)
        CASE
          WHEN max_avg_order > 0 THEN (avg_order_value / max_avg_order)::real
          ELSE 0
        END                                                                            AS monetary_score,
        -- Churn risk: sigmoid centred at ${CHURN_CENTER_DAYS} days, steepness ${CHURN_STEEPNESS}
        (1.0 / (1.0 + exp(-((days_since_last - ${CHURN_CENTER_DAYS}) / ${CHURN_STEEPNESS}))))::real AS churn_risk_score,
        now()
      FROM normalised
      ON CONFLICT (customer_id) DO UPDATE SET
        total_revenue    = EXCLUDED.total_revenue,
        ltv              = EXCLUDED.ltv,
        order_count      = EXCLUDED.order_count,
        avg_order_value  = EXCLUDED.avg_order_value,
        last_purchase_at = EXCLUDED.last_purchase_at,
        recency_score    = EXCLUDED.recency_score,
        frequency_score  = EXCLUDED.frequency_score,
        monetary_score   = EXCLUDED.monetary_score,
        churn_risk_score = EXCLUDED.churn_risk_score,
        updated_at       = EXCLUDED.updated_at
    `);

    const queryResult = result as { rowCount?: number } | unknown[];
    const processed = Array.isArray(queryResult)
      ? queryResult.length
      : ((queryResult as { rowCount?: number }).rowCount ?? 0);

    return { processed };
  }
}
