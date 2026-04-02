import { z } from "zod";

export const CampaignDraftSchema = z.object({
  name: z.string().min(1, "Campaign name is required."),
  subject: z.string().min(1, "Subject is required."),
  message: z.string().min(1, "Message is required."),
  segment: z.string().min(1, "Segment is required."),
  scheduledAt: z.string().nullable().optional(),
  aiEnhanced: z.boolean(),
});
