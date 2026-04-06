import { tool } from "ai";
import { z } from "zod";
import { getCustomerLTV } from "@/lib/db/queries";

export const getCustomerLTVTool = tool({
  description:
    "Look up lifetime value and purchase metrics for a specific customer by ID.",
  inputSchema: z.object({
    customerId: z.string().uuid(),
  }),
  execute: async ({ customerId }) => {
    const customer = await getCustomerLTV({ customerId });

    if (!customer) {
      return { error: "Customer not found." };
    }

    return customer;
  },
});
