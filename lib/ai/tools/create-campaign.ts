import { tool } from "ai";
import { z } from "zod";
import type { AuthSession } from "@/lib/auth/types";
import { createCampaignDraft } from "@/lib/looply/services";

export const createCampaign = ({ session }: { session: AuthSession }) =>
  tool({
    description:
      "Create a draft campaign for a segment or explicit recipients. After drafting, use sendCampaign with confirm:false to show approval UI.",
    inputSchema: z.object({
      name: z.string().min(1),
      subject: z.string().min(1),
      message: z.string().min(1),
      segment: z.string().min(1),
      recipients: z
        .array(
          z.object({
            name: z.string(),
            email: z.string().email(),
          })
        )
        .optional(),
    }),
    execute: async ({ message, name, recipients, segment, subject }) =>
      createCampaignDraft({
        createdBy: session.user.id,
        message,
        name,
        recipients,
        segment,
        subject,
      }),
  });
