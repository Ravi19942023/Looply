import { tool } from "ai";
import { z } from "zod";

import type { CustomerService } from "@/backend/modules/customers";

export function buildCustomerTools(customerService: CustomerService, actorId: string) {
  return {
    getCustomerLTV: tool({
      description:
        "Look up the lifetime value (LTV) and metrics for a specific customer by their ID. Returns total revenue, LTV, order count, average order value, last purchase date, and churn risk score. Use this when the user asks about a specific customer's value or purchase history.",
      inputSchema: z.object({
        customerId: z.string().uuid().describe("The customer ID to look up"),
      }),
      execute: async ({ customerId }) =>
        customerService.getCustomerLtv(customerId, actorId),
    }),
    getTopCustomers: tool({
      description:
        "Retrieve the highest-value customers ranked by total revenue. Returns customer names, revenue amounts, and purchase history. Use for VIP identification, revenue analysis, and top-customer queries.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(50).default(10).describe("Number of top customers to return"),
      }),
      execute: async ({ limit }) => customerService.getTopCustomers(limit, actorId),
    }),
    getChurnRiskCustomers: tool({
      description:
        "Find customers at risk of churning based on inactivity. Returns customers who haven't purchased within the specified window, with risk indicators. Use for retention planning, re-engagement campaigns, and at-risk customer analysis.",
      inputSchema: z.object({
        daysSinceLastPurchase: z.number().int().min(1).default(60).describe("Number of days of inactivity to consider as churn risk"),
      }),
      execute: async ({ daysSinceLastPurchase }) =>
        customerService.getChurnRiskCustomers(actorId, daysSinceLastPurchase),
    }),
    searchCustomers: tool({
      description:
        "Generic advanced search for customers. Supports filtering by name, email, segment, revenue, LTV, and order counts. Use this for complex queries like 'finding all customers with LTV over 500' or 'searching for an email like @gmail.com'.",
      inputSchema: z.object({
        filters: z.array(z.object({
          field: z.enum(["name", "email", "phone", "segment", "totalRevenue", "ltv", "orderCount", "avgOrderValue", "churnRiskScore", "lastPurchaseAt"]),
          operator: z.enum(["eq", "neq", "contains", "gt", "lt", "gte", "lte", "in", "is_null", "is_not_null"]),
          value: z.any().optional(),
        })).min(1).describe("List of filter criteria"),
        logic: z.enum(["and", "or"]).default("and").describe("Logic to combine filters"),
        sortBy: z.string().optional().describe("Field to sort by"),
        sortOrder: z.enum(["asc", "desc"]).default("desc").describe("Sort direction"),
        limit: z.number().int().min(1).max(100).default(20).describe("Max items to return"),
      }),
      execute: async (input) => customerService.searchCustomers({
        ...input,
        pageSize: input.limit,
      }, actorId),
    }),
  };
}
