import { z } from "zod";

export const AuditQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  event: z.string().trim().optional(),
  actorId: z.string().trim().optional(),
});
