import { tool } from "ai";
import { z } from "zod";
import { getAnalyticsSummary } from "@/lib/looply/services";

export const getAnalyticsSummaryTool = tool({
  description:
    "Retrieve analytics KPIs and recent order summaries for a period.",
  inputSchema: z.object({
    days: z.number().int().min(1).max(365).default(30),
  }),
  execute: async ({ days }) => getAnalyticsSummary(days),
});
