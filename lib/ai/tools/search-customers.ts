import { tool } from "ai";
import { z } from "zod";
import { searchCustomers } from "@/lib/looply/services";

export const searchCustomersTool = tool({
  description: "Advanced multi-field customer search using filters and logic.",
  inputSchema: z.object({
    filters: z
      .array(
        z.object({
          field: z.string(),
          operator: z.enum(["eq", "neq", "contains", "gt", "lt", "gte", "lte"]),
          value: z.union([z.string(), z.number()]).optional(),
        })
      )
      .default([]),
    logic: z.enum(["and", "or"]).default("and"),
  }),
  execute: async ({ filters, logic }) => searchCustomers(filters, logic),
});
