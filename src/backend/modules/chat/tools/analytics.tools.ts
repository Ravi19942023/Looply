import { tool } from "ai";
import { z } from "zod";

import type { AnalyticsService } from "@/backend/modules/analytics";

export function buildAnalyticsTools(analyticsService: AnalyticsService, actorId: string) {
  return {
    getAnalyticsSummary: tool({
      description:
        "Retrieve analytics KPIs and revenue summaries for a specified period (in days). Limited to 30 days of historical data for fine-grained analysis. Use this for performance reviews, trend analysis, and dashboard-style queries. You can filter by standard windows or provide a specific day count.",
      inputSchema: z.object({
        days: z.number().int().min(1).max(30).default(30).describe("Time period in days (Max 30)"),
        filters: z.array(z.object({
          field: z.string(),
          operator: z.enum(["eq", "gt", "lt", "contains"]),
          value: z.any()
        })).optional().describe("Optional property/segment filters for the summary"),
      }),
      execute: async ({ days }) => analyticsService.getSummary(actorId, days),
    }),
  };
}
