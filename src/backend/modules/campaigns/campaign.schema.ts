import { z } from "zod";

export const CreateCampaignSchema = z.object({
  name: z.string().min(1).max(255),
  subject: z.string().min(1).max(500),
  message: z.string().min(1),
  segment: z.string().min(1).max(100),
  recipients: z.array(z.object({ name: z.string(), email: z.string() })).optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
});

export const CampaignListQuerySchema = z.object({
  status: z.string().trim().optional(),
});

export const CampaignSendSchema = z.object({
  sendNow: z.boolean().default(true),
});
