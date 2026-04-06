import { tool } from "ai";
import { z } from "zod";
import type { AuthSession } from "@/lib/auth/types";
import { sendCampaignDraft } from "@/lib/looply/services";

export const sendCampaign = ({ session: _session }: { session: AuthSession }) =>
  tool({
    description:
      "Prepare a campaign approval card or send an existing draft campaign when confirm is true.",
    inputSchema: z.object({
      campaignId: z.string().uuid(),
      confirm: z.boolean().default(false),
    }),
    execute: async ({ campaignId, confirm }) =>
      sendCampaignDraft(campaignId, confirm, _session.user.id),
  });
