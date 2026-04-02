import { z } from "zod";

export const CustomerListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  query: z.string().trim().optional(),
});

export const TopCustomersQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const ChurnCustomersQuerySchema = z.object({
  daysSinceLastPurchase: z.coerce.number().int().min(1).default(60),
});

export const CustomerIdParamSchema = z.object({
  id: z.string().min(1),
});
