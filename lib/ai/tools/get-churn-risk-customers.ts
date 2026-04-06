import { tool } from "ai";
import { z } from "zod";
import { getChurnRiskCustomers } from "@/lib/looply/services";

export const getChurnRiskCustomersTool = tool({
  description:
    "Identify customers at risk of churn based on inactivity thresholds.",
  inputSchema: z.object({
    daysSinceLastPurchase: z.number().int().min(1).max(365).default(90),
  }),
  execute: async ({ daysSinceLastPurchase }) =>
    getChurnRiskCustomers(daysSinceLastPurchase),
});
