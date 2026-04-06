import { tool } from "ai";
import { z } from "zod";
import { getTopCustomers } from "@/lib/looply/services";

export const getTopCustomersTool = tool({
  description: "Retrieve the highest-value customers by revenue.",
  inputSchema: z.object({
    limit: z.number().int().min(1).max(20).default(5),
  }),
  execute: async ({ limit }) => getTopCustomers(limit),
});
